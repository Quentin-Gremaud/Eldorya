import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CreateACampaignHandler } from './commands/create-a-campaign.handler.js';
import { SendACampaignAnnouncementHandler } from './commands/send-a-campaign-announcement.handler.js';
import { ArchiveACampaignHandler } from './commands/archive-a-campaign.handler.js';
import { ReactivateACampaignHandler } from './commands/reactivate-a-campaign.handler.js';
import { ActiveCampaignCounterAdapter } from '../../infrastructure/campaign/active-campaign-counter.adapter.js';
import { SubscriptionTierCheckerAdapter } from '../../infrastructure/campaign/subscription-tier-checker.adapter.js';
import { UserDisplayNameResolverAdapter } from '../../infrastructure/campaign/user-display-name-resolver.adapter.js';
import { KurrentDbCampaignRepository } from '../../infrastructure/campaign/kurrentdb-campaign.repository.js';
import { ACTIVE_CAMPAIGN_COUNTER } from './active-campaign-counter.port.js';
import { SUBSCRIPTION_TIER_CHECKER } from './subscription-tier-checker.port.js';
import { USER_DISPLAY_NAME_RESOLVER } from './user-display-name-resolver.port.js';
import { CAMPAIGN_REPOSITORY } from './campaign.repository.port.js';
import { SystemClock, CLOCK } from '../../shared/clock.js';

@Module({
  imports: [CqrsModule],
  providers: [
    CreateACampaignHandler,
    SendACampaignAnnouncementHandler,
    ArchiveACampaignHandler,
    ReactivateACampaignHandler,
    {
      provide: CAMPAIGN_REPOSITORY,
      useClass: KurrentDbCampaignRepository,
    },
    {
      provide: ACTIVE_CAMPAIGN_COUNTER,
      useClass: ActiveCampaignCounterAdapter,
    },
    {
      provide: SUBSCRIPTION_TIER_CHECKER,
      useClass: SubscriptionTierCheckerAdapter,
    },
    {
      provide: USER_DISPLAY_NAME_RESOLVER,
      useClass: UserDisplayNameResolverAdapter,
    },
    { provide: CLOCK, useClass: SystemClock },
  ],
})
export class CampaignDomainModule {}
