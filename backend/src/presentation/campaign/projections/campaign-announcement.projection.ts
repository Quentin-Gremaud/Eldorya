import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { START, eventTypeFilter } from '@kurrent/kurrentdb-client';
import { KurrentDbService } from '../../../infrastructure/eventstore/kurrentdb.service.js';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import { resolveGmDisplayName } from '../finders/gm-display-name.util.js';

@Injectable()
export class CampaignAnnouncementProjection
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(CampaignAnnouncementProjection.name);
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
        where: { projectionName: 'CampaignAnnouncementProjection' },
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
          prefixes: ['CampaignAnnouncementSent'],
        }),
      });

      this.logger.log(
        `CampaignAnnouncement projection started from ${checkpoint ? `position ${checkpoint.commitPosition}` : 'START'}`,
      );

      for await (const resolvedEvent of subscription) {
        if (this.abortController.signal.aborted) break;
        if (!resolvedEvent.event) continue;

        try {
          const eventType = resolvedEvent.event.type;
          const data = resolvedEvent.event.data as Record<string, unknown>;

          if (eventType === 'CampaignAnnouncementSent') {
            await this.handleCampaignAnnouncementSent(data);
          }

          const position = resolvedEvent.event?.position;
          if (position) {
            await this.prisma.projectionCheckpoint.upsert({
              where: {
                projectionName: 'CampaignAnnouncementProjection',
              },
              create: {
                projectionName: 'CampaignAnnouncementProjection',
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
        'CampaignAnnouncement projection subscription error — will retry in 5s',
        err instanceof Error ? err.stack : String(err),
      );
      setTimeout(() => {
        if (!this.abortController?.signal.aborted) {
          void this.startSubscription();
        }
      }, 5000);
    }
  }

  async handleCampaignAnnouncementSent(
    data: Record<string, unknown>,
  ): Promise<void> {
    const announcementId = this.requireString(data, 'announcementId');
    const campaignId = this.requireString(data, 'campaignId');
    const content = this.requireString(data, 'content');
    const gmUserId = this.requireString(data, 'gmUserId');
    const timestamp = new Date(this.requireString(data, 'timestamp'));

    // Prefer gmDisplayName from event payload (new events).
    // Fall back to DB lookup for old events persisted before this field existed.
    let gmDisplayName = data.gmDisplayName as string | undefined;
    if (!gmDisplayName) {
      const gmUser = await this.prisma.user.findFirst({
        where: { clerkUserId: gmUserId },
        select: { firstName: true, lastName: true, email: true },
      });
      gmDisplayName = resolveGmDisplayName(gmUser);
    }

    await this.prisma.campaignAnnouncement.upsert({
      where: { id: announcementId },
      create: {
        id: announcementId,
        campaignId,
        content,
        gmUserId,
        gmDisplayName,
        createdAt: timestamp,
      },
      update: {},
    });

    const players = await this.prisma.campaignMember.findMany({
      where: { campaignId, role: 'player' },
      select: { userId: true },
    });

    const contentPreview =
      content.length > 200 ? content.substring(0, 200) + '...' : content;

    await this.prisma.notification.createMany({
      data: players.map((player) => ({
        userId: player.userId,
        type: 'campaign_announcement',
        title: `New announcement from ${gmDisplayName}`,
        content: contentPreview,
        campaignId,
        referenceId: announcementId,
      })),
      skipDuplicates: true,
    });

    this.logger.log(
      `Announcement ${announcementId} projected — ${players.length} notifications created`,
    );
  }

  private requireString(
    data: Record<string, unknown>,
    field: string,
  ): string {
    const value = data[field];
    if (typeof value !== 'string') {
      throw new Error(
        `CampaignAnnouncementProjection: missing or invalid field "${field}" (got ${typeof value})`,
      );
    }
    return value;
  }
}
