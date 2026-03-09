import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';

@Injectable()
export class InvitationAcceptedSideEffectsService {
  private readonly logger = new Logger(
    InvitationAcceptedSideEffectsService.name,
  );

  constructor(private readonly prisma: PrismaService) {}

  async execute(campaignId: string, userId: string): Promise<void> {
    // H1: Wrap in transaction for atomicity
    // M14: Use check-then-create for idempotency — replaying InvitationAccepted won't fail on unique constraint
    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.campaignMember.findUnique({
        where: { campaignId_userId: { campaignId, userId } },
      });

      if (existing) {
        this.logger.warn(
          `CampaignMember already exists for user ${userId} in campaign ${campaignId} — skipping (idempotent)`,
        );
        return;
      }

      await tx.campaignMember.create({
        data: { campaignId, userId, role: 'player' },
      });
      await tx.campaign.update({
        where: { id: campaignId },
        data: { playerCount: { increment: 1 } },
      });
    });

    this.logger.log(
      `CampaignMember created and playerCount incremented for campaign ${campaignId}`,
    );
  }
}
