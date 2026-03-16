import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { StartSessionCommand } from './start-session.command.js';
import type { SessionRepository } from '../session.repository.js';
import { SESSION_REPOSITORY } from '../session.repository.js';
import { SessionAggregate } from '../session.aggregate.js';
import type { Clock } from '../../../shared/clock.js';
import { CLOCK } from '../../../shared/clock.js';

@CommandHandler(StartSessionCommand)
export class StartSessionHandler
  implements ICommandHandler<StartSessionCommand>
{
  private readonly logger = new Logger(StartSessionHandler.name);

  constructor(
    @Inject(SESSION_REPOSITORY)
    private readonly sessionRepository: SessionRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(command: StartSessionCommand): Promise<void> {
    const aggregate = SessionAggregate.start(
      command.sessionId,
      command.campaignId,
      command.gmUserId,
      this.clock,
    );

    await this.sessionRepository.saveNew(aggregate);

    this.logger.log(
      `SessionStarted event persisted for session ${command.sessionId} in campaign ${command.campaignId}`,
    );
  }
}
