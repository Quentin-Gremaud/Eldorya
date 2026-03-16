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
import { RoomManagerService } from './services/room-manager.service.js';

@Injectable()
export class SessionEventSubscriber implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SessionEventSubscriber.name);
  private abortController: AbortController | null = null;

  constructor(
    private readonly kurrentDb: KurrentDbService,
    private readonly prisma: PrismaService,
    private readonly sessionGateway: SessionGateway,
    private readonly roomManager: RoomManagerService,
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
        where: { projectionName: 'SessionEventSubscriber' },
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
          prefixes: ['Session'],
        }),
      });

      this.logger.log(
        `Session event subscription started from ${checkpoint ? `position ${checkpoint.commitPosition}` : 'START'}`,
      );

      for await (const resolvedEvent of subscription) {
        if (this.abortController.signal.aborted) break;
        if (!resolvedEvent.event) continue;

        try {
          const eventType = resolvedEvent.event.type;
          const data = resolvedEvent.event.data as Record<string, unknown>;
          const metadata = resolvedEvent.event.metadata as Record<string, unknown> | undefined;

          if (eventType === 'SessionModeChanged') {
            const sessionId = data.sessionId as string;
            const campaignId = data.campaignId as string;
            const newMode = data.newMode as string;

            const roomName = this.roomManager.getRoomName(sessionId);

            if (newMode === 'live') {
              this.sessionGateway.server?.to(roomName).emit('SessionModeLive', {
                type: 'SessionModeLive',
                data: { sessionId, campaignId, mode: 'live' },
                metadata: {
                  campaignId,
                  timestamp: metadata?.timestamp,
                },
              });
              this.logger.log(
                `Emitted SessionModeLive to room ${roomName}`,
              );
            } else if (newMode === 'preparation') {
              this.sessionGateway.server?.to(roomName).emit('SessionModePreparation', {
                type: 'SessionModePreparation',
                data: { sessionId, campaignId, mode: 'preparation' },
                metadata: {
                  campaignId,
                  timestamp: metadata?.timestamp,
                },
              });
              this.logger.log(
                `Emitted SessionModePreparation to room ${roomName}`,
              );
            }
          }

          const position = resolvedEvent.event?.position;
          if (position) {
            await this.prisma.projectionCheckpoint.upsert({
              where: { projectionName: 'SessionEventSubscriber' },
              create: {
                projectionName: 'SessionEventSubscriber',
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
            `Error processing session event ${resolvedEvent.event.id}`,
            err instanceof Error ? err.stack : String(err),
          );
        }
      }
    } catch (err) {
      if (this.abortController?.signal.aborted) return;
      this.logger.error(
        'Session event subscription error — will retry in 5s',
        err instanceof Error ? err.stack : String(err),
      );
      setTimeout(() => {
        if (!this.abortController?.signal.aborted) {
          void this.startSubscription();
        }
      }, 5000);
    }
  }
}
