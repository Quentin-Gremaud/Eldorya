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
export class MapLevelProjection implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MapLevelProjection.name);
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
        where: { projectionName: 'MapLevelProjection' },
      });

      const fromPosition = checkpoint
        ? {
            commit: BigInt(checkpoint.commitPosition),
            prepare: BigInt(checkpoint.preparePosition),
          }
        : START;

      const subscription = client.subscribeToAll({
        fromPosition,
        filter: eventTypeFilter({ prefixes: ['MapLevel'] }),
      });

      this.logger.log(
        `MapLevel projection subscription started from ${checkpoint ? `position ${checkpoint.commitPosition}` : 'START'}`,
      );

      for await (const resolvedEvent of subscription) {
        if (this.abortController.signal.aborted) break;
        if (!resolvedEvent.event) continue;

        try {
          const eventType = resolvedEvent.event.type;
          const data = resolvedEvent.event.data as Record<string, unknown>;

          if (eventType === 'MapLevelCreated') {
            await this.handleMapLevelCreated(data);
          } else if (eventType === 'MapLevelRenamed') {
            await this.handleMapLevelRenamed(data);
          } else if (eventType === 'MapLevelBackgroundSet') {
            await this.handleMapLevelBackgroundSet(data);
          }

          const position = resolvedEvent.event?.position;
          if (position) {
            await this.prisma.projectionCheckpoint.upsert({
              where: { projectionName: 'MapLevelProjection' },
              create: {
                projectionName: 'MapLevelProjection',
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
        'MapLevel projection subscription error — will retry in 5s',
        err instanceof Error ? err.stack : String(err),
      );
      setTimeout(() => {
        if (!this.abortController?.signal.aborted) {
          void this.startSubscription();
        }
      }, 5000);
    }
  }

  async handleMapLevelCreated(data: Record<string, unknown>): Promise<void> {
    const mapLevelId = data.mapLevelId as string;
    const campaignId = data.campaignId as string;
    const name = data.name as string;
    const parentId = (data.parentId as string | null) ?? null;
    const depth = data.depth as number;
    const createdAt = data.createdAt as string;

    await this.prisma.mapLevel.upsert({
      where: { id: mapLevelId },
      create: {
        id: mapLevelId,
        campaignId,
        name,
        parentId,
        depth,
        createdAt: new Date(createdAt),
      },
      update: {
        name,
        parentId,
        depth,
      },
    });

    this.logger.log(
      `MapLevel '${name}' created (depth ${depth}) in campaign ${campaignId}`,
    );
  }

  async handleMapLevelRenamed(data: Record<string, unknown>): Promise<void> {
    const mapLevelId = data.mapLevelId as string;
    const newName = data.newName as string;

    await this.prisma.mapLevel.updateMany({
      where: { id: mapLevelId },
      data: { name: newName },
    });

    this.logger.log(`MapLevel ${mapLevelId} renamed to '${newName}'`);
  }

  async handleMapLevelBackgroundSet(data: Record<string, unknown>): Promise<void> {
    const mapLevelId = data.mapLevelId;
    const backgroundImageUrl = data.backgroundImageUrl;

    if (typeof mapLevelId !== 'string' || typeof backgroundImageUrl !== 'string') {
      throw new Error(
        `Invalid MapLevelBackgroundSet event data: mapLevelId=${typeof mapLevelId}, backgroundImageUrl=${typeof backgroundImageUrl}`,
      );
    }

    await this.prisma.mapLevel.updateMany({
      where: { id: mapLevelId },
      data: { backgroundImageUrl },
    });

    this.logger.log(`MapLevel ${mapLevelId} background set`);
  }
}
