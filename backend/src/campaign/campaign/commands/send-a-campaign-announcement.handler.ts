import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { SendACampaignAnnouncementCommand } from './send-a-campaign-announcement.command.js';
import type { Clock } from '../../../shared/clock.js';
import { CLOCK } from '../../../shared/clock.js';
import type { CampaignRepository } from '../campaign.repository.port.js';
import { CAMPAIGN_REPOSITORY } from '../campaign.repository.port.js';
import type { UserDisplayNameResolver } from '../user-display-name-resolver.port.js';
import { USER_DISPLAY_NAME_RESOLVER } from '../user-display-name-resolver.port.js';

@CommandHandler(SendACampaignAnnouncementCommand)
export class SendACampaignAnnouncementHandler
  implements ICommandHandler<SendACampaignAnnouncementCommand>
{
  private readonly logger = new Logger(SendACampaignAnnouncementHandler.name);

  constructor(
    @Inject(CAMPAIGN_REPOSITORY)
    private readonly campaignRepository: CampaignRepository,
    @Inject(USER_DISPLAY_NAME_RESOLVER)
    private readonly displayNameResolver: UserDisplayNameResolver,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(command: SendACampaignAnnouncementCommand): Promise<void> {
    const aggregate = await this.campaignRepository.load(command.campaignId);
    const gmDisplayName = await this.displayNameResolver.resolve(
      command.userId,
    );

    aggregate.sendAnnouncement(
      command.announcementId,
      command.content,
      command.userId,
      gmDisplayName,
      this.clock.now(),
    );

    await this.campaignRepository.save(aggregate, command.userId);

    this.logger.log(
      `CampaignAnnouncementSent event persisted: announcement=${command.announcementId} campaign=${command.campaignId}`,
    );
  }
}
