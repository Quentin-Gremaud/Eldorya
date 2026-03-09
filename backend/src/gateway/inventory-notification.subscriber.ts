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
export class InventoryNotificationSubscriber implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(InventoryNotificationSubscriber.name);
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
        where: { projectionName: 'InventoryNotificationSubscriber' },
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
          prefixes: ['InventoryModifiedByGM'],
        }),
      });

      this.logger.log(
        `Inventory notification subscription started from ${checkpoint ? `position ${checkpoint.commitPosition}` : 'START'}`,
      );

      for await (const resolvedEvent of subscription) {
        if (this.abortController.signal.aborted) break;
        if (!resolvedEvent.event) continue;

        try {
          const data = resolvedEvent.event.data as Record<string, unknown>;
          const characterId = data.characterId as string;

          const character = await this.prisma.character.findUnique({
            where: { id: characterId },
            select: { userId: true },
          });

          if (character) {
            this.emitToUser(character.userId, 'InventoryModifiedByGM', {
              characterId,
              modificationType: data.modificationType,
              itemId: data.itemId,
              details: data.details,
              modifiedAt: data.modifiedAt,
            });
          }

          const position = resolvedEvent.event?.position;
          if (position) {
            await this.prisma.projectionCheckpoint.upsert({
              where: { projectionName: 'InventoryNotificationSubscriber' },
              create: {
                projectionName: 'InventoryNotificationSubscriber',
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
            `Error processing inventory notification ${resolvedEvent.event.id}`,
            err instanceof Error ? err.stack : String(err),
          );
        }
      }
    } catch (err) {
      if (this.abortController?.signal.aborted) return;
      this.logger.error(
        'Inventory notification subscription error — will retry in 5s',
        err instanceof Error ? err.stack : String(err),
      );
      setTimeout(() => {
        if (!this.abortController?.signal.aborted) {
          void this.startSubscription();
        }
      }, 5000);
    }
  }

  private emitToUser(userId: string, event: string, data: Record<string, unknown>): void {
    const server = this.sessionGateway.server;
    if (!server) return;

    for (const [, socket] of server.sockets.sockets) {
      const authSocket = socket as unknown as AuthenticatedSocket;
      if (authSocket.userId === userId) {
        authSocket.emit(event, data);
        this.logger.log(
          `Emitted ${event} to user ${userId} (socket ${authSocket.id})`,
        );
      }
    }
  }
}
