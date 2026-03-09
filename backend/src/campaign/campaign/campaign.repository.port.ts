import type { CampaignAggregate } from './campaign.aggregate.js';

export interface CampaignRepository {
  saveNew(aggregate: CampaignAggregate, userId: string): Promise<void>;
  save(aggregate: CampaignAggregate, userId: string): Promise<void>;
  load(campaignId: string): Promise<CampaignAggregate>;
}

export const CAMPAIGN_REPOSITORY = 'CAMPAIGN_REPOSITORY';
