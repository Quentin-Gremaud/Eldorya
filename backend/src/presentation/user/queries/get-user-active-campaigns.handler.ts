import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUserActiveCampaignsQuery } from './get-user-active-campaigns.query.js';
import {
  UserActiveCampaignsFinder,
  ActiveCampaignResult,
} from '../finders/user-active-campaigns.finder.js';

@QueryHandler(GetUserActiveCampaignsQuery)
export class GetUserActiveCampaignsHandler implements IQueryHandler<
  GetUserActiveCampaignsQuery,
  { count: number; campaigns: ActiveCampaignResult[] }
> {
  constructor(private readonly finder: UserActiveCampaignsFinder) {}

  async execute(
    query: GetUserActiveCampaignsQuery,
  ): Promise<{ count: number; campaigns: ActiveCampaignResult[] }> {
    return this.finder.findActiveByGmUserId(query.userId);
  }
}
