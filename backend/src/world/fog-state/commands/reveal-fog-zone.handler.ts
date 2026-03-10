import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { RevealFogZoneCommand } from './reveal-fog-zone.command.js';
import { FogZone } from '../fog-zone.js';
import type { FogStateRepository } from '../fog-state.repository.js';
import { FOG_STATE_REPOSITORY } from '../fog-state.repository.js';
import type { Clock } from '../../../shared/clock.js';
import { CLOCK } from '../../../shared/clock.js';

@CommandHandler(RevealFogZoneCommand)
export class RevealFogZoneHandler
  implements ICommandHandler<RevealFogZoneCommand>
{
  private readonly logger = new Logger(RevealFogZoneHandler.name);

  constructor(
    @Inject(FOG_STATE_REPOSITORY)
    private readonly fogStateRepository: FogStateRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(command: RevealFogZoneCommand): Promise<void> {
    const aggregate = await this.fogStateRepository.load(
      command.campaignId,
      command.playerId,
    );

    const fogZone = FogZone.create(
      command.fogZoneId,
      command.mapLevelId,
      command.x,
      command.y,
      command.width,
      command.height,
    );

    aggregate.revealZone(fogZone, this.clock);

    await this.fogStateRepository.save(aggregate);

    this.logger.log(
      `FogZone ${command.fogZoneId} revealed for player ${command.playerId} in campaign ${command.campaignId}`,
    );
  }
}
