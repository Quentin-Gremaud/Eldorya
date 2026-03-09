export interface SubscriptionTierChecker {
  isProUser(userId: string): Promise<boolean>;
}

export const SUBSCRIPTION_TIER_CHECKER = 'SUBSCRIPTION_TIER_CHECKER';
