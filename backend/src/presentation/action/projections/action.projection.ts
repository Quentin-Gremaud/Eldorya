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
        filter: eventTypeFilter({ prefixes: ['PlayerPinged', 'ActionProposed'] }),
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
          proposedAt: new Date(proposedAt),
        },
      ],
      skipDuplicates: true,
    });

    this.logger.log(
      `Action ${actionId} proposed by player ${playerId} in session ${sessionId}`,
    );
  }
}
