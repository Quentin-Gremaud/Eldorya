import { Controller, Get } from '@nestjs/common';
import { CampaignStatusEnum } from '@prisma/client';
import { AuthUserId } from '../../../infrastructure/auth/auth-user-id.decorator.js';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';

@Controller('campaigns')
export class GetCampaignActiveCountController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('active-count')
  async handle(
    @AuthUserId() userId: string,
  ): Promise<{ count: number }> {
    const count = await this.prisma.campaign.count({
      where: {
        gmUserId: userId,
        status: { not: CampaignStatusEnum.archived },
      },
    });

    return { count };
  }
}
