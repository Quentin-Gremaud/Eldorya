import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { START, eventTypeFilter } from '@kurrent/kurrentdb-client';
import { CampaignStatusEnum } from '@prisma/client';
import { KurrentDbService } from '../../../infrastructure/eventstore/kurrentdb.service.js';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';

@Injectable()
export class CampaignProjection implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CampaignProjection.name);
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
        where: { projectionName: 'CampaignProjection' },
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
          prefixes: [
            'CampaignCreated',
            'CampaignArchived',
            'CampaignReactivated',
          ],
        }),
      });

      this.logger.log(
        `Campaign projection catch-up subscription started from ${checkpoint ? `position ${checkpoint.commitPosition}` : 'START'}`,
      );

      for await (const resolvedEvent of subscription) {
        if (this.abortController.signal.aborted) break;
        if (!resolvedEvent.event) continue;

        try {
          const eventType = resolvedEvent.event.type;
          const data = resolvedEvent.event.data as Record<string, unknown>;

          if (eventType === 'CampaignCreated') {
            await this.handleCampaignCreated(data);
          } else if (eventType === 'CampaignArchived') {
            await this.handleCampaignArchived(data);
          } else if (eventType === 'CampaignReactivated') {
            await this.handleCampaignReactivated(data);
          }

          const position = resolvedEvent.event?.position;
          if (position) {
            await this.prisma.projectionCheckpoint.upsert({
              where: { projectionName: 'CampaignProjection' },
              create: {
                projectionName: 'CampaignProjection',
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
        'Campaign projection subscription error — will retry in 5s',
        err instanceof Error ? err.stack : String(err),
      );
      setTimeout(() => {
        if (!this.abortController?.signal.aborted) {
          void this.startSubscription();
        }
      }, 5000);
    }
  }

  async handleCampaignCreated(data: Record<string, unknown>): Promise<void> {
    const campaignId = data.campaignId as string;
    const name = data.name as string;
    const description = (data.description as string) ?? '';
    const gmUserId = data.gmUserId as string;
    const createdAt = new Date(data.createdAt as string);

    await this.prisma.campaign.upsert({
      where: { id: campaignId },
      create: {
        id: campaignId,
        name,
        description,
        gmUserId,
        status: CampaignStatusEnum.active,
        playerCount: 0,
        createdAt,
      },
      update: {
        name,
        description,
      },
    });

    this.logger.log(`Campaign ${campaignId} projected to read model`);
  }

  async handleCampaignArchived(data: Record<string, unknown>): Promise<void> {
    const campaignId = data.campaignId as string;

    const { players } = await this.prisma.$transaction(async (tx) => {
      const updatedCampaign = await tx.campaign.update({
        where: { id: campaignId },
        data: { status: CampaignStatusEnum.archived },
        select: { name: true },
      });

      const campaignPlayers = await tx.campaignMember.findMany({
        where: { campaignId, role: 'player' },
        select: { userId: true },
      });

      await tx.notification.createMany({
        data: campaignPlayers.map((player) => ({
          userId: player.userId,
          type: 'campaign_archived',
          title: 'Campaign archived',
          content: `${updatedCampaign.name} has been archived by the GM. It is now read-only.`,
          campaignId,
          referenceId: campaignId,
        })),
        skipDuplicates: true,
      });

      return { campaign: updatedCampaign, players: campaignPlayers };
    });

    this.logger.log(
      `Campaign ${campaignId} archived — ${players.length} notifications created`,
    );
  }

  async handleCampaignReactivated(
    data: Record<string, unknown>,
  ): Promise<void> {
    const campaignId = data.campaignId as string;

    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: { status: CampaignStatusEnum.active },
    });

    this.logger.log(`Campaign ${campaignId} reactivated`);
  }
}
