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
export class SessionProjection implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SessionProjection.name);
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
        where: { projectionName: 'SessionProjection' },
      });

      const fromPosition = checkpoint
        ? {
            commit: BigInt(checkpoint.commitPosition),
            prepare: BigInt(checkpoint.preparePosition),
          }
        : START;

      const subscription = client.subscribeToAll({
        fromPosition,
        filter: eventTypeFilter({ prefixes: ['Session', 'PipelineMode'] }),
      });

      this.logger.log(
        `Session projection subscription started from ${checkpoint ? `position ${checkpoint.commitPosition}` : 'START'}`,
      );

      for await (const resolvedEvent of subscription) {
        if (this.abortController.signal.aborted) break;
        if (!resolvedEvent.event) continue;

        try {
          const eventType = resolvedEvent.event.type;
          const data = resolvedEvent.event.data as Record<string, unknown>;

          if (eventType === 'SessionStarted') {
            await this.handleSessionStarted(data);
          } else if (eventType === 'SessionModeChanged') {
            await this.handleSessionModeChanged(data);
          } else if (eventType === 'PipelineModeChanged') {
            await this.handlePipelineModeChanged(data);
          }

          const position = resolvedEvent.event?.position;
          if (position) {
            await this.prisma.projectionCheckpoint.upsert({
              where: { projectionName: 'SessionProjection' },
              create: {
                projectionName: 'SessionProjection',
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
        'Session projection subscription error — will retry in 5s',
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

  async handleSessionStarted(data: Record<string, unknown>): Promise<void> {
    const sessionId = this.requireString(data, 'sessionId', 'SessionStarted');
    const campaignId = this.requireString(data, 'campaignId', 'SessionStarted');
    const gmUserId = this.requireString(data, 'gmUserId', 'SessionStarted');
    const mode = this.requireString(data, 'mode', 'SessionStarted');
    const startedAt = this.requireString(data, 'startedAt', 'SessionStarted');

    await this.prisma.session.createMany({
      data: [
        {
          id: sessionId,
          campaignId,
          gmUserId,
          mode,
          status: 'active',
          startedAt: new Date(startedAt),
        },
      ],
      skipDuplicates: true,
    });

    this.logger.log(
      `Session ${sessionId} started in campaign ${campaignId} by GM ${gmUserId}`,
    );
  }

  async handleSessionModeChanged(data: Record<string, unknown>): Promise<void> {
    const sessionId = this.requireString(data, 'sessionId', 'SessionModeChanged');
    const campaignId = this.requireString(data, 'campaignId', 'SessionModeChanged');
    const newMode = this.requireString(data, 'newMode', 'SessionModeChanged');

    await this.prisma.session.updateMany({
      where: { id: sessionId, campaignId },
      data: { mode: newMode },
    });

    this.logger.log(`Session ${sessionId} mode changed to ${newMode}`);
  }

  async handlePipelineModeChanged(data: Record<string, unknown>): Promise<void> {
    const sessionId = this.requireString(data, 'sessionId', 'PipelineModeChanged');
    const campaignId = this.requireString(data, 'campaignId', 'PipelineModeChanged');
    const pipelineMode = this.requireString(data, 'pipelineMode', 'PipelineModeChanged');

    await this.prisma.session.updateMany({
      where: { id: sessionId, campaignId },
      data: { pipelineMode },
    });

    this.logger.log(`Session ${sessionId} pipeline mode changed to ${pipelineMode}`);
  }
}
