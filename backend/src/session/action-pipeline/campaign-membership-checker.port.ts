export interface CampaignMembershipChecker {
  isMember(campaignId: string, userId: string): Promise<boolean>;
}

export const CAMPAIGN_MEMBERSHIP_CHECKER = 'CAMPAIGN_MEMBERSHIP_CHECKER';
