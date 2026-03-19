import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { START, eventTypeFilter } from '@kurrent/kurrentdb-client';
import { KurrentDbService } from '../../../infrastructure/eventstore/kurrentdb.service.js';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';

@Injectable()
export class ActionProjection implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ActionProjection.name);
  private abortController: AbortController | null = null;

  constructor(
    private readonly kurrentDb: KurrentDbService,
    private readonly prisma: PrismaService,
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
        where: { projectionName: 'ActionProjection' },
      });

      const fromPosition = checkpoint
        ? {
            commit: BigInt(checkpoint.commitPosition),
            prepare: BigInt(checkpoint.preparePosition),
          }
        : START;

      const subscription = client.subscribeToAll({
        fromPosition,
        filter: eventTypeFilter({ prefixes: ['PlayerPinged', 'ActionProposed', 'ActionValidated', 'ActionRejected', 'ActionQueueReordered', 'ActionCancelled'] }),
      });

      this.logger.log(
        `Action projection subscription started from ${checkpoint ? `position ${checkpoint.commitPosition}` : 'START'}`,
      );

      for await (const resolvedEvent of subscription) {
        if (this.abortController.signal.aborted) break;
        if (!resolvedEvent.event) continue;

        try {
          const eventType = resolvedEvent.event.type;
          const data = resolvedEvent.event.data as Record<string, unknown>;

          if (eventType === 'PlayerPinged') {
            await this.handlePlayerPinged(data);
          } else if (eventType === 'ActionProposed') {
            await this.handleActionProposed(data);
          } else if (eventType === 'ActionValidated') {
            await this.handleActionValidated(data);
          } else if (eventType === 'ActionRejected') {
            await this.handleActionRejected(data);
          } else if (eventType === 'ActionQueueReordered') {
            await this.handleActionQueueReordered(data);
          } else if (eventType === 'ActionCancelled') {
            await this.handleActionCancelled(data);
          }

          const position = resolvedEvent.event?.position;
          if (position) {
            await this.prisma.projectionCheckpoint.upsert({
              where: { projectionName: 'ActionProjection' },
              create: {
                projectionName: 'ActionProjection',
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
            `Error projecting event ${resolvedEvent.event.id}`,
            err instanceof Error ? err.stack : String(err),
          );
        }
      }
    } catch (err) {
      if (this.abortController?.signal.aborted) return;
      this.logger.error(
        'Action projection subscription error — will retry in 5s',
        err instanceof Error ? err.stack : String(err),
      );
      setTimeout(() => {
        if (!this.abortController?.signal.aborted) {
          void this.startSubscription();
        }
      }, 5000);
    }
  }

  private requireString(data: Record<string, unknown>, field: string, eventType: string): string {
    const value = data[field];
    if (typeof value !== 'string') {
      throw new Error(`Invalid event data: "${field}" must be a string in ${eventType}, got ${typeof value}`);
    }
    return value;
  }

  async handlePlayerPinged(data: Record<string, unknown>): Promise<void> {
    const sessionId = this.requireString(data, 'sessionId', 'PlayerPinged');
    const campaignId = this.requireString(data, 'campaignId', 'PlayerPinged');
    const playerId = this.requireString(data, 'playerId', 'PlayerPinged');
    const gmUserId = this.requireString(data, 'gmUserId', 'PlayerPinged');
    const pingedAt = this.requireString(data, 'pingedAt', 'PlayerPinged');

    await this.prisma.sessionPing.create({
      data: {
        sessionId,
        campaignId,
        playerId,
        gmUserId,
        pingedAt: new Date(pingedAt),
      },
    });

    this.logger.log(
      `Player ${playerId} pinged in session ${sessionId}`,
    );
  }

  async handleActionProposed(data: Record<string, unknown>): Promise<void> {
    const actionId = this.requireString(data, 'actionId', 'ActionProposed');
    const sessionId = this.requireString(data, 'sessionId', 'ActionProposed');
    const campaignId = this.requireString(data, 'campaignId', 'ActionProposed');
    const playerId = this.requireString(data, 'playerId', 'ActionProposed');
    const actionType = this.requireString(data, 'actionType', 'ActionProposed');
    const description = this.requireString(data, 'description', 'ActionProposed');
    const target = typeof data.target === 'string' ? data.target : null;
    const proposedAt = this.requireString(data, 'proposedAt', 'ActionProposed');

    const maxPosition = await this.prisma.sessionAction.aggregate({
      where: { sessionId, campaignId, status: 'pending' },
      _max: { queuePosition: true },
    });
    const nextPosition = (maxPosition._max.queuePosition ?? -1) + 1;

    await this.prisma.sessionAction.createMany({
      data: [
        {
          id: actionId,
          sessionId,
          campaignId,
          playerId,
          actionType,
          description,
          target,
          status: 'pending',
          queuePosition: nextPosition,
          proposedAt: new Date(proposedAt),
        },
      ],
      skipDuplicates: true,
    });

    this.logger.log(
      `Action ${actionId} proposed by player ${playerId} in session ${sessionId}`,
    );
  }

  async handleActionValidated(data: Record<string, unknown>): Promise<void> {
    const actionId = this.requireString(data, 'actionId', 'ActionValidated');
    const campaignId = this.requireString(data, 'campaignId', 'ActionValidated');
    const validatedAt = this.requireString(data, 'validatedAt', 'ActionValidated');
    const narrativeNote = typeof data.narrativeNote === 'string' ? data.narrativeNote : null;

    await this.prisma.sessionAction.updateMany({
      where: { id: actionId, campaignId },
      data: {
        status: 'validated',
        narrativeNote,
        resolvedAt: new Date(validatedAt),
      },
    });

    this.logger.log(`Action ${actionId} validated`);
  }

  async handleActionRejected(data: Record<string, unknown>): Promise<void> {
    const actionId = this.requireString(data, 'actionId', 'ActionRejected');
    const campaignId = this.requireString(data, 'campaignId', 'ActionRejected');
    const rejectedAt = this.requireString(data, 'rejectedAt', 'ActionRejected');
    const feedback = this.requireString(data, 'feedback', 'ActionRejected');

    await this.prisma.sessionAction.updateMany({
      where: { id: actionId, campaignId },
      data: {
        status: 'rejected',
        feedback,
        resolvedAt: new Date(rejectedAt),
      },
    });

    this.logger.log(`Action ${actionId} rejected`);
  }

  async handleActionCancelled(data: Record<string, unknown>): Promise<void> {
    const actionId = this.requireString(data, 'actionId', 'ActionCancelled');
    const campaignId = this.requireString(data, 'campaignId', 'ActionCancelled');
    const cancelledAt = this.requireString(data, 'cancelledAt', 'ActionCancelled');

    await this.prisma.sessionAction.updateMany({
      where: { id: actionId, campaignId },
      data: {
        status: 'cancelled',
        resolvedAt: new Date(cancelledAt),
      },
    });

    this.logger.log(`Action ${actionId} cancelled`);
  }

  async handleActionQueueReordered(data: Record<string, unknown>): Promise<void> {
    const campaignId = this.requireString(data, 'campaignId', 'ActionQueueReordered');
    const orderedActionIds = data.orderedActionIds;
    if (!Array.isArray(orderedActionIds)) {
      throw new Error('Invalid event data: "orderedActionIds" must be an array in ActionQueueReordered');
    }

    await this.prisma.$transaction(
      orderedActionIds.map((actionId: string, i: number) =>
        this.prisma.sessionAction.updateMany({
          where: { id: actionId, campaignId, status: 'pending' },
          data: { queuePosition: i },
        }),
      ),
    );

    this.logger.log(
      `Action queue reordered: ${orderedActionIds.length} actions updated`,
    );
  }
}
