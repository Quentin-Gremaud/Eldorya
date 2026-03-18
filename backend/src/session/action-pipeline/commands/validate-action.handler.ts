import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { ValidateActionCommand } from './validate-action.command.js';
import type { ActionPipelineRepository } from '../action-pipeline.repository.js';
import { ACTION_PIPELINE_REPOSITORY } from '../action-pipeline.repository.js';
import type { Clock } from '../../../shared/clock.js';
import { CLOCK } from '../../../shared/clock.js';
import { SessionNotLiveException } from '../exceptions/session-not-live.exception.js';
import type { SessionLivenessChecker } from '../session-liveness-checker.port.js';
import { SESSION_LIVENESS_CHECKER } from '../session-liveness-checker.port.js';

@CommandHandler(ValidateActionCommand)
export class ValidateActionHandler
  implements ICommandHandler<ValidateActionCommand>
{
  private readonly logger = new Logger(ValidateActionHandler.name);

  constructor(
    @Inject(ACTION_PIPELINE_REPOSITORY)
    private readonly repository: ActionPipelineRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
    @Inject(SESSION_LIVENESS_CHECKER)
    private readonly sessionLivenessChecker: SessionLivenessChecker,
  ) {}

  async execute(command: ValidateActionCommand): Promise<void> {
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

    aggregate.validateAction(
      command.actionId,
      liveSession.gmUserId,
      command.callerUserId,
      command.narrativeNote,
      this.clock,
    );

    if (aggregate.isNew()) {
      await this.repository.saveNew(aggregate);
    } else {
      await this.repository.save(aggregate);
    }

    this.logger.log(
      `ActionValidated event persisted for action ${command.actionId} in session ${command.sessionId}`,
    );
  }
}
