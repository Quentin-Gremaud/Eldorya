import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { CreateACampaignCommand } from './create-a-campaign.command.js';
import { CampaignAggregate } from '../campaign.aggregate.js';
import type { Clock } from '../../../shared/clock.js';
import { CLOCK } from '../../../shared/clock.js';
import type { ActiveCampaignCounter } from '../active-campaign-counter.port.js';
import { ACTIVE_CAMPAIGN_COUNTER } from '../active-campaign-counter.port.js';
import type { SubscriptionTierChecker } from '../subscription-tier-checker.port.js';
import { SUBSCRIPTION_TIER_CHECKER } from '../subscription-tier-checker.port.js';
import type { CampaignRepository } from '../campaign.repository.port.js';
import { CAMPAIGN_REPOSITORY } from '../campaign.repository.port.js';

@CommandHandler(CreateACampaignCommand)
export class CreateACampaignHandler
  implements ICommandHandler<CreateACampaignCommand>
{
  private readonly logger = new Logger(CreateACampaignHandler.name);

  constructor(
    @Inject(CAMPAIGN_REPOSITORY)
    private readonly campaignRepository: CampaignRepository,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ACTIVE_CAMPAIGN_COUNTER)
    private readonly activeCampaignCounter: ActiveCampaignCounter,
    @Inject(SUBSCRIPTION_TIER_CHECKER)
    private readonly subscriptionTierChecker: SubscriptionTierChecker,
  ) {}

  async execute(command: CreateACampaignCommand): Promise<void> {
    const aggregate = await CampaignAggregate.create(
      command.campaignId,
      command.name,
      command.description,
      command.userId,
      this.clock.now(),
      this.activeCampaignCounter,
      this.subscriptionTierChecker,
    );

    await this.campaignRepository.saveNew(aggregate, command.userId);

    this.logger.log(
      `CampaignCreated event persisted for campaign ${command.campaignId}`,
    );
  }
}
