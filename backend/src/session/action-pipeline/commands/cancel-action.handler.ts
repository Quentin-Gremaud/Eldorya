import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { CancelActionCommand } from './cancel-action.command.js';
import type { ActionPipelineRepository } from '../action-pipeline.repository.js';
import { ACTION_PIPELINE_REPOSITORY } from '../action-pipeline.repository.js';
import type { Clock } from '../../../shared/clock.js';
import { CLOCK } from '../../../shared/clock.js';
import { SessionNotLiveException } from '../exceptions/session-not-live.exception.js';
import { PlayerNotInCampaignException } from '../exceptions/player-not-in-campaign.exception.js';
import type { SessionLivenessChecker } from '../session-liveness-checker.port.js';
import { SESSION_LIVENESS_CHECKER } from '../session-liveness-checker.port.js';
import type { CampaignMembershipChecker } from '../campaign-membership-checker.port.js';
import { CAMPAIGN_MEMBERSHIP_CHECKER } from '../campaign-membership-checker.port.js';

@CommandHandler(CancelActionCommand)
export class CancelActionHandler
  implements ICommandHandler<CancelActionCommand>
{
  private readonly logger = new Logger(CancelActionHandler.name);

  constructor(
    @Inject(ACTION_PIPELINE_REPOSITORY)
    private readonly repository: ActionPipelineRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
    @Inject(SESSION_LIVENESS_CHECKER)
    private readonly sessionLivenessChecker: SessionLivenessChecker,
    @Inject(CAMPAIGN_MEMBERSHIP_CHECKER)
    private readonly campaignMembershipChecker: CampaignMembershipChecker,
  ) {}

  async execute(command: CancelActionCommand): Promise<void> {
    const liveSession = await this.sessionLivenessChecker.getLiveSession(
      command.sessionId,
      command.campaignId,
    );
    if (!liveSession) {
      throw SessionNotLiveException.forSession(command.sessionId);
    }

    const isMember = await this.campaignMembershipChecker.isMember(
      command.campaignId,
      command.callerUserId,
    );
    if (!isMember) {
      throw PlayerNotInCampaignException.forPlayer(command.callerUserId, command.campaignId);
    }

    const aggregate = await this.repository.load(command.sessionId);

    aggregate.cancelAction(
      command.actionId,
      command.callerUserId,
      command.callerUserId,
      this.clock,
    );

    await this.repository.save(aggregate);

    this.logger.log(
      `ActionCancelled event persisted for action ${command.actionId} in session ${command.sessionId}`,
    );
  }
}
