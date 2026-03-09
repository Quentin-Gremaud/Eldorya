import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { ReactivateACampaignCommand } from './reactivate-a-campaign.command.js';
import type { Clock } from '../../../shared/clock.js';
import { CLOCK } from '../../../shared/clock.js';
import type { CampaignRepository } from '../campaign.repository.port.js';
import { CAMPAIGN_REPOSITORY } from '../campaign.repository.port.js';
import type { SubscriptionTierChecker } from '../subscription-tier-checker.port.js';
import { SUBSCRIPTION_TIER_CHECKER } from '../subscription-tier-checker.port.js';

@CommandHandler(ReactivateACampaignCommand)
export class ReactivateACampaignHandler
  implements ICommandHandler<ReactivateACampaignCommand>
{
  private readonly logger = new Logger(ReactivateACampaignHandler.name);

  constructor(
    @Inject(CAMPAIGN_REPOSITORY)
    private readonly campaignRepository: CampaignRepository,
    @Inject(SUBSCRIPTION_TIER_CHECKER)
    private readonly subscriptionTierChecker: SubscriptionTierChecker,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(command: ReactivateACampaignCommand): Promise<void> {
    const aggregate = await this.campaignRepository.load(command.campaignId);

    await aggregate.reactivateCampaign(
      command.userId,
      this.clock.now(),
      this.subscriptionTierChecker,
    );

    await this.campaignRepository.save(aggregate, command.userId);

    this.logger.log(
      `CampaignReactivated event persisted: campaign=${command.campaignId}`,
    );
  }
}
