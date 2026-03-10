import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { START, eventTypeFilter } from '@kurrent/kurrentdb-client';
import { KurrentDbService } from '../../../infrastructure/eventstore/kurrentdb.service.js';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';

interface RevealedZoneData {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  revealedAt: string;
}

@Injectable()
export class FogStateProjection implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(FogStateProjection.name);
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
        where: { projectionName: 'FogStateProjection' },
      });

      const fromPosition = checkpoint
        ? {
            commit: BigInt(checkpoint.commitPosition),
            prepare: BigInt(checkpoint.preparePosition),
          }
        : START;

      const subscription = client.subscribeToAll({
        fromPosition,
        filter: eventTypeFilter({ prefixes: ['FogState', 'FogZone'] }),
      });

      this.logger.log(
        `Fog state projection subscription started from ${checkpoint ? `position ${checkpoint.commitPosition}` : 'START'}`,
      );

      for await (const resolvedEvent of subscription) {
        if (this.abortController.signal.aborted) break;
        if (!resolvedEvent.event) continue;

        try {
          const eventType = resolvedEvent.event.type;
          const data = resolvedEvent.event.data as Record<string, unknown>;

          if (eventType === 'FogStateInitialized') {
            await this.handleFogStateInitialized(data);
          } else if (eventType === 'FogZoneRevealed') {
            await this.handleFogZoneRevealed(data);
          } else if (eventType === 'FogZoneHidden') {
            await this.handleFogZoneHidden(data);
          }

          const position = resolvedEvent.event?.position;
          if (position) {
            await this.prisma.projectionCheckpoint.upsert({
              where: { projectionName: 'FogStateProjection' },
              create: {
                projectionName: 'FogStateProjection',
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
        'Fog state projection subscription error — will retry in 5s',
        err instanceof Error ? err.stack : String(err),
      );
      setTimeout(() => {
        if (!this.abortController?.signal.aborted) {
          void this.startSubscription();
        }
      }, 5000);
    }
  }

  async handleFogStateInitialized(data: Record<string, unknown>): Promise<void> {
    // FogStateInitialized doesn't create fog_states rows yet —
    // rows are created per mapLevel on first reveal.
    const campaignId = data.campaignId as string;
    const playerId = data.playerId as string;

    this.logger.log(
      `FogState initialized for player ${playerId} in campaign ${campaignId}`,
    );
  }

  async handleFogZoneRevealed(data: Record<string, unknown>): Promise<void> {
    const campaignId = data.campaignId as string;
    const playerId = data.playerId as string;
    const mapLevelId = data.mapLevelId as string;
    const fogZoneId = data.fogZoneId as string;
    const x = data.x as number;
    const y = data.y as number;
    const width = data.width as number;
    const height = data.height as number;
    const revealedAt = data.revealedAt as string;

    const newZone: RevealedZoneData = { id: fogZoneId, x, y, width, height, revealedAt };

    const existing = await this.prisma.fogState.findUnique({
      where: {
        campaignId_playerId_mapLevelId: { campaignId, playerId, mapLevelId },
      },
    });

    if (existing) {
      const zones = existing.revealedZones as RevealedZoneData[];
      const alreadyExists = zones.some((z) => z.id === fogZoneId);
      if (!alreadyExists) {
        zones.push(newZone);
        await this.prisma.fogState.update({
          where: {
            campaignId_playerId_mapLevelId: { campaignId, playerId, mapLevelId },
          },
          data: { revealedZones: zones },
        });
      }
    } else {
      await this.prisma.fogState.create({
        data: {
          campaignId,
          playerId,
          mapLevelId,
          revealedZones: [newZone],
        },
      });
    }

    this.logger.log(
      `FogZone ${fogZoneId} revealed on map ${mapLevelId} for player ${playerId}`,
    );
  }

  async handleFogZoneHidden(data: Record<string, unknown>): Promise<void> {
    const campaignId = data.campaignId as string;
    const playerId = data.playerId as string;
    const mapLevelId = data.mapLevelId as string;
    const fogZoneId = data.fogZoneId as string;

    const existing = await this.prisma.fogState.findUnique({
      where: {
        campaignId_playerId_mapLevelId: { campaignId, playerId, mapLevelId },
      },
    });

    if (existing) {
      const zones = (existing.revealedZones as RevealedZoneData[]).filter(
        (z) => z.id !== fogZoneId,
      );
      await this.prisma.fogState.update({
        where: {
          campaignId_playerId_mapLevelId: { campaignId, playerId, mapLevelId },
        },
        data: { revealedZones: zones },
      });
    }

    this.logger.log(
      `FogZone ${fogZoneId} hidden on map ${mapLevelId} for player ${playerId}`,
    );
  }
}
