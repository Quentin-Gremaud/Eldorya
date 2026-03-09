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
export class TokenProjection implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TokenProjection.name);
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
        where: { projectionName: 'TokenProjection' },
      });

      const fromPosition = checkpoint
        ? {
            commit: BigInt(checkpoint.commitPosition),
            prepare: BigInt(checkpoint.preparePosition),
          }
        : START;

      const subscription = client.subscribeToAll({
        fromPosition,
        filter: eventTypeFilter({ prefixes: ['Token'] }),
      });

      this.logger.log(
        `Token projection subscription started from ${checkpoint ? `position ${checkpoint.commitPosition}` : 'START'}`,
      );

      for await (const resolvedEvent of subscription) {
        if (this.abortController.signal.aborted) break;
        if (!resolvedEvent.event) continue;

        try {
          const eventType = resolvedEvent.event.type;
          const data = resolvedEvent.event.data as Record<string, unknown>;

          if (eventType === 'TokenPlaced') {
            await this.handleTokenPlaced(data);
          } else if (eventType === 'TokenMoved') {
            await this.handleTokenMoved(data);
          } else if (eventType === 'TokenRemoved') {
            await this.handleTokenRemoved(data);
          }

          const position = resolvedEvent.event?.position;
          if (position) {
            await this.prisma.projectionCheckpoint.upsert({
              where: { projectionName: 'TokenProjection' },
              create: {
                projectionName: 'TokenProjection',
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
        'Token projection subscription error — will retry in 5s',
        err instanceof Error ? err.stack : String(err),
      );
      setTimeout(() => {
        if (!this.abortController?.signal.aborted) {
          void this.startSubscription();
        }
      }, 5000);
    }
  }

  async handleTokenPlaced(data: Record<string, unknown>): Promise<void> {
    const tokenId = data.tokenId as string;
    const campaignId = data.campaignId as string;
    const mapLevelId = data.mapLevelId as string;
    const x = data.x as number;
    const y = data.y as number;
    const tokenType = data.tokenType as string;
    const label = data.label as string;
    const placedAt = data.placedAt as string;

    await this.prisma.token.createMany({
      data: [
        {
          id: tokenId,
          campaignId,
          mapLevelId,
          x,
          y,
          tokenType,
          label,
          createdAt: new Date(placedAt),
        },
      ],
      skipDuplicates: true,
    });

    this.logger.log(
      `Token '${label}' (${tokenType}) placed at (${x}, ${y}) in campaign ${campaignId}`,
    );
  }

  async handleTokenMoved(data: Record<string, unknown>): Promise<void> {
    const tokenId = data.tokenId as string;
    const campaignId = data.campaignId as string;
    const x = data.x as number;
    const y = data.y as number;

    await this.prisma.token.updateMany({
      where: { id: tokenId, campaignId },
      data: { x, y },
    });

    this.logger.log(`Token ${tokenId} moved to (${x}, ${y})`);
  }

  async handleTokenRemoved(data: Record<string, unknown>): Promise<void> {
    const tokenId = data.tokenId as string;
    const campaignId = data.campaignId as string;

    await this.prisma.token.deleteMany({
      where: { id: tokenId, campaignId },
    });

    this.logger.log(`Token ${tokenId} removed`);
  }
}
