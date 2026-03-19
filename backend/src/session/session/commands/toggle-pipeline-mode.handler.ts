import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { TogglePipelineModeCommand } from './toggle-pipeline-mode.command.js';
import type { SessionRepository } from '../session.repository.js';
import { SESSION_REPOSITORY } from '../session.repository.js';
import type { Clock } from '../../../shared/clock.js';
import { CLOCK } from '../../../shared/clock.js';

@CommandHandler(TogglePipelineModeCommand)
export class TogglePipelineModeHandler
  implements ICommandHandler<TogglePipelineModeCommand>
{
  private readonly logger = new Logger(TogglePipelineModeHandler.name);

  constructor(
    @Inject(SESSION_REPOSITORY)
    private readonly sessionRepository: SessionRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(command: TogglePipelineModeCommand): Promise<void> {
    const aggregate = await this.sessionRepository.load(command.sessionId);

    aggregate.togglePipelineMode(
      command.pipelineMode,
      command.callerUserId,
      this.clock,
    );

    await this.sessionRepository.save(aggregate);

    this.logger.log(
      `PipelineModeChanged event persisted for session ${command.sessionId} to mode ${command.pipelineMode}`,
    );
  }
}
