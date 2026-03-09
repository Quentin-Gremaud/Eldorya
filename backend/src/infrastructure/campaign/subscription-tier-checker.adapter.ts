import { Injectable } from '@nestjs/common';
import { SubscriptionTierChecker } from '../../campaign/campaign/subscription-tier-checker.port.js';

@Injectable()
export class SubscriptionTierCheckerAdapter implements SubscriptionTierChecker {
  async isProUser(_userId: string): Promise<boolean> {
    // Always returns false until Epic 9 implements Stripe integration
    return false;
  }
}
