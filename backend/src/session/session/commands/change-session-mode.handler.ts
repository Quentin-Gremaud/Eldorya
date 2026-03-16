import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { ChangeSessionModeCommand } from './change-session-mode.command.js';
import type { SessionRepository } from '../session.repository.js';
import { SESSION_REPOSITORY } from '../session.repository.js';
import type { Clock } from '../../../shared/clock.js';
import { CLOCK } from '../../../shared/clock.js';

@CommandHandler(ChangeSessionModeCommand)
export class ChangeSessionModeHandler
  implements ICommandHandler<ChangeSessionModeCommand>
{
  private readonly logger = new Logger(ChangeSessionModeHandler.name);

  constructor(
    @Inject(SESSION_REPOSITORY)
    private readonly sessionRepository: SessionRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(command: ChangeSessionModeCommand): Promise<void> {
    const aggregate = await this.sessionRepository.load(command.sessionId);

    aggregate.changeMode(command.newMode, this.clock);

    await this.sessionRepository.save(aggregate);

    this.logger.log(
      `SessionModeChanged event persisted for session ${command.sessionId} to mode ${command.newMode}`,
    );
  }
}
