import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { START, eventTypeFilter } from '@kurrent/kurrentdb-client';
import { KurrentDbService } from '../infrastructure/eventstore/kurrentdb.service.js';
import { PrismaService } from '../infrastructure/database/prisma.service.js';
import { SessionGateway } from './session.gateway.js';
import type { AuthenticatedSocket } from './types/authenticated-socket.js';

@Injectable()
export class FogEventSubscriber implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(FogEventSubscriber.name);
  private abortController: AbortController | null = null;

  constructor(
    private readonly kurrentDb: KurrentDbService,
    private readonly prisma: PrismaService,
    private readonly sessionGateway: SessionGateway,
  ) {}

  onModuleInit() {
    void this.startSubscription();
  }

  onModuleDestroy() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  private async startSubscription() {
    this.abortController = new AbortController();

    try {
      const client = this.kurrentDb.getClient();

      const checkpoint = await this.prisma.projectionCheckpoint.findUnique({
        where: { projectionName: 'FogEventSubscriber' },
      });

      const fromPosition = checkpoint
        ? {
            commit: BigInt(checkpoint.commitPosition),
            prepare: BigInt(checkpoint.preparePosition),
          }
        : START;

      const subscription = client.subscribeToAll({
        fromPosition,
        filter: eventTypeFilter({
          prefixes: ['FogZone'],
        }),
      });

      this.logger.log(
        `Fog event subscription started from ${checkpoint ? `position ${checkpoint.commitPosition}` : 'START'}`,
      );

      for await (const resolvedEvent of subscription) {
        if (this.abortController.signal.aborted) break;
        if (!resolvedEvent.event) continue;

        try {
          const eventType = resolvedEvent.event.type;
          const data = resolvedEvent.event.data as Record<string, unknown>;
          const metadata = resolvedEvent.event.metadata as Record<string, unknown> | undefined;
          const playerId = data.playerId as string;
          const campaignId = data.campaignId as string;

          if (eventType === 'FogZoneRevealed' || eventType === 'FogZoneHidden') {
            this.emitToPlayer(playerId, eventType, {
              type: eventType,
              data,
              metadata: {
                campaignId,
                sessionId: metadata?.correlationId,
                timestamp: metadata?.timestamp,
              },
            });
          }

          const position = resolvedEvent.event?.position;
          if (position) {
            await this.prisma.projectionCheckpoint.upsert({
              where: { projectionName: 'FogEventSubscriber' },
              create: {
                projectionName: 'FogEventSubscriber',
                commitPosition: String(position.commit),
                preparePosition: String(position.prepare),
              },
              update: {
                commitPosition: String(position.commit),
                preparePosition: String(position.prepare),
              },
            });
          }
        } catch (err) {
          this.logger.error(
            `Error processing fog event ${resolvedEvent.event.id}`,
            err instanceof Error ? err.stack : String(err),
          );
        }
      }
    } catch (err) {
      if (this.abortController?.signal.aborted) return;
      this.logger.error(
        'Fog event subscription error — will retry in 5s',
        err instanceof Error ? err.stack : String(err),
      );
      setTimeout(() => {
        if (!this.abortController?.signal.aborted) {
          void this.startSubscription();
        }
      }, 5000);
    }
  }

  // TODO: When session rooms are implemented (Epic 6A), use Socket.io rooms
  // per campaign (`campaign:{campaignId}`) for server-side campaign isolation.
  // Currently, sockets only carry userId (no campaignId). The frontend filters
  // events by campaignId client-side, but cross-campaign data may reach the client.
  private emitToPlayer(playerId: string, event: string, payload: Record<string, unknown>): void {
    const server = this.sessionGateway.server;
    if (!server) return;

    for (const [, socket] of server.sockets.sockets) {
      const authSocket = socket as unknown as AuthenticatedSocket;
      if (authSocket.userId === playerId) {
        authSocket.emit(event, payload);
        this.logger.log(
          `Emitted ${event} to player ${playerId} (socket ${authSocket.id})`,
        );
      }
    }
  }
}
