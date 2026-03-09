export interface ActiveCampaignCounter {
  countByGmUserId(userId: string): Promise<number>;
}

export const ACTIVE_CAMPAIGN_COUNTER = 'ACTIVE_CAMPAIGN_COUNTER';
