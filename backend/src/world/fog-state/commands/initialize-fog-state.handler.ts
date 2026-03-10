import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { InitializeFogStateCommand } from './initialize-fog-state.command.js';
import { FogStateAggregate } from '../fog-state.aggregate.js';
import type { FogStateRepository } from '../fog-state.repository.js';
import { FOG_STATE_REPOSITORY } from '../fog-state.repository.js';
import type { Clock } from '../../../shared/clock.js';
import { CLOCK } from '../../../shared/clock.js';

@CommandHandler(InitializeFogStateCommand)
export class InitializeFogStateHandler
  implements ICommandHandler<InitializeFogStateCommand>
{
  private readonly logger = new Logger(InitializeFogStateHandler.name);

  constructor(
    @Inject(FOG_STATE_REPOSITORY)
    private readonly fogStateRepository: FogStateRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(command: InitializeFogStateCommand): Promise<void> {
    const aggregate = FogStateAggregate.initialize(
      command.campaignId,
      command.playerId,
      this.clock,
    );

    await this.fogStateRepository.saveNew(aggregate);

    this.logger.log(
      `FogState initialized for player ${command.playerId} in campaign ${command.campaignId}`,
    );
  }
}
