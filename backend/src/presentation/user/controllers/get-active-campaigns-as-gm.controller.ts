import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { AuthUserId } from '../../../infrastructure/auth/auth-user-id.decorator.js';
import { GetUserActiveCampaignsQuery } from '../queries/get-user-active-campaigns.query.js';
import { ActiveCampaignResult } from '../finders/user-active-campaigns.finder.js';

@Controller('account')
export class GetActiveCampaignsAsGmController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('active-campaigns')
  async handle(
    @AuthUserId() userId: string,
  ): Promise<{ data: { count: number; campaigns: ActiveCampaignResult[] } }> {
    const result = await this.queryBus.execute<
      GetUserActiveCampaignsQuery,
      { count: number; campaigns: ActiveCampaignResult[] }
    >(new GetUserActiveCampaignsQuery(userId));

    return { data: result };
  }
}
