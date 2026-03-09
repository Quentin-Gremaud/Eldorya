import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { ArchiveACampaignCommand } from './archive-a-campaign.command.js';
import type { Clock } from '../../../shared/clock.js';
import { CLOCK } from '../../../shared/clock.js';
import type { CampaignRepository } from '../campaign.repository.port.js';
import { CAMPAIGN_REPOSITORY } from '../campaign.repository.port.js';

@CommandHandler(ArchiveACampaignCommand)
export class ArchiveACampaignHandler
  implements ICommandHandler<ArchiveACampaignCommand>
{
  private readonly logger = new Logger(ArchiveACampaignHandler.name);

  constructor(
    @Inject(CAMPAIGN_REPOSITORY)
    private readonly campaignRepository: CampaignRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(command: ArchiveACampaignCommand): Promise<void> {
    const aggregate = await this.campaignRepository.load(command.campaignId);

    aggregate.archiveCampaign(command.userId, this.clock.now());

    await this.campaignRepository.save(aggregate, command.userId);

    this.logger.log(
      `CampaignArchived event persisted: campaign=${command.campaignId}`,
    );
  }
}
