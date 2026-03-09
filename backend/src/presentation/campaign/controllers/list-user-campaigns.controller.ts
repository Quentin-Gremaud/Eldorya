import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { AuthUserId } from '../../../infrastructure/auth/auth-user-id.decorator.js';
import { GetUserCampaignsQuery } from '../queries/get-user-campaigns.query.js';
import { CampaignSummaryDto } from '../dto/campaign-summary.dto.js';

@Controller('campaigns')
export class ListUserCampaignsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async handle(
    @AuthUserId() userId: string,
  ): Promise<{ data: CampaignSummaryDto[] }> {
    const campaigns = await this.queryBus.execute<
      GetUserCampaignsQuery,
      CampaignSummaryDto[]
    >(new GetUserCampaignsQuery(userId));

    return { data: campaigns };
  }
}
