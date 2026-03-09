import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { RenameMapLevelCommand } from './rename-map-level.command.js';
import type { MapRepository } from '../map.repository.js';
import { MAP_REPOSITORY } from '../map.repository.js';
import type { Clock } from '../../../shared/clock.js';
import { CLOCK } from '../../../shared/clock.js';

@CommandHandler(RenameMapLevelCommand)
export class RenameMapLevelHandler
  implements ICommandHandler<RenameMapLevelCommand>
{
  private readonly logger = new Logger(RenameMapLevelHandler.name);

  constructor(
    @Inject(MAP_REPOSITORY)
    private readonly mapRepository: MapRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(command: RenameMapLevelCommand): Promise<void> {
    const map = await this.mapRepository.load(command.campaignId);

    map.renameLevel(command.mapLevelId, command.newName, this.clock);

    await this.mapRepository.save(map);

    this.logger.log(
      `MapLevelRenamed event persisted for level ${command.mapLevelId} in campaign ${command.campaignId}`,
    );
  }
}
