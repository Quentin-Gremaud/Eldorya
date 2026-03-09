import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUserCampaignsQuery } from './get-user-campaigns.query.js';
import { UserCampaignsFinder } from '../finders/user-campaigns.finder.js';
import { CampaignSummaryDto } from '../dto/campaign-summary.dto.js';

@QueryHandler(GetUserCampaignsQuery)
export class GetUserCampaignsHandler implements IQueryHandler<
  GetUserCampaignsQuery,
  CampaignSummaryDto[]
> {
  constructor(private readonly finder: UserCampaignsFinder) {}

  async execute(query: GetUserCampaignsQuery): Promise<CampaignSummaryDto[]> {
    return this.finder.findByUserId(query.userId);
  }
}
