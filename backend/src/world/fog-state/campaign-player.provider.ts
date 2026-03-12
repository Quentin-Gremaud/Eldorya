export interface CampaignPlayerProvider {
  getPlayerIdsForCampaign(campaignId: string): Promise<string[]>;
}

export const CAMPAIGN_PLAYER_PROVIDER = 'CAMPAIGN_PLAYER_PROVIDER';
