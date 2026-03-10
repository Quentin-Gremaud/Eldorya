import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { HideFogZoneCommand } from './hide-fog-zone.command.js';
import type { FogStateRepository } from '../fog-state.repository.js';
import { FOG_STATE_REPOSITORY } from '../fog-state.repository.js';
import type { Clock } from '../../../shared/clock.js';
import { CLOCK } from '../../../shared/clock.js';

@CommandHandler(HideFogZoneCommand)
export class HideFogZoneHandler
  implements ICommandHandler<HideFogZoneCommand>
{
  private readonly logger = new Logger(HideFogZoneHandler.name);

  constructor(
    @Inject(FOG_STATE_REPOSITORY)
    private readonly fogStateRepository: FogStateRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(command: HideFogZoneCommand): Promise<void> {
    const aggregate = await this.fogStateRepository.load(
      command.campaignId,
      command.playerId,
    );

    aggregate.hideZone(command.fogZoneId, this.clock);

    await this.fogStateRepository.save(aggregate);

    this.logger.log(
      `FogZone ${command.fogZoneId} hidden for player ${command.playerId} in campaign ${command.campaignId}`,
    );
  }
}
