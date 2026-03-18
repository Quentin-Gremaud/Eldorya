import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { RejectActionCommand } from './reject-action.command.js';
import type { ActionPipelineRepository } from '../action-pipeline.repository.js';
import { ACTION_PIPELINE_REPOSITORY } from '../action-pipeline.repository.js';
import type { Clock } from '../../../shared/clock.js';
import { CLOCK } from '../../../shared/clock.js';
import { SessionNotLiveException } from '../exceptions/session-not-live.exception.js';
import type { SessionLivenessChecker } from '../session-liveness-checker.port.js';
import { SESSION_LIVENESS_CHECKER } from '../session-liveness-checker.port.js';

@CommandHandler(RejectActionCommand)
export class RejectActionHandler
  implements ICommandHandler<RejectActionCommand>
{
  private readonly logger = new Logger(RejectActionHandler.name);

  constructor(
    @Inject(ACTION_PIPELINE_REPOSITORY)
    private readonly repository: ActionPipelineRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
    @Inject(SESSION_LIVENESS_CHECKER)
    private readonly sessionLivenessChecker: SessionLivenessChecker,
  ) {}

  async execute(command: RejectActionCommand): Promise<void> {
    const liveSession = await this.sessionLivenessChecker.getLiveSession(
      command.sessionId,
      command.campaignId,
    );
    if (!liveSession) {
      throw SessionNotLiveException.forSession(command.sessionId);
    }

    const aggregate = await this.repository.loadOrCreate(
      command.sessionId,
      command.campaignId,
    );

    aggregate.rejectAction(
      command.actionId,
      liveSession.gmUserId,
      command.callerUserId,
      command.feedback,
      this.clock,
    );

    if (aggregate.isNew()) {
      await this.repository.saveNew(aggregate);
    } else {
      await this.repository.save(aggregate);
    }

    this.logger.log(
      `ActionRejected event persisted for action ${command.actionId} in session ${command.sessionId}`,
    );
  }
}
