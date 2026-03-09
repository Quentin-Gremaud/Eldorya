export interface MembershipChecker {
  isMember(campaignId: string, userId: string): Promise<boolean>;
}
