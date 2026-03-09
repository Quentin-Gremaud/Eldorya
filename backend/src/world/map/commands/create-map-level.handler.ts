import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { CreateMapLevelCommand } from './create-map-level.command.js';
import type { MapRepository } from '../map.repository.js';
import { MAP_REPOSITORY } from '../map.repository.js';
import type { Clock } from '../../../shared/clock.js';
import { CLOCK } from '../../../shared/clock.js';

@CommandHandler(CreateMapLevelCommand)
export class CreateMapLevelHandler
  implements ICommandHandler<CreateMapLevelCommand>
{
  private readonly logger = new Logger(CreateMapLevelHandler.name);

  constructor(
    @Inject(MAP_REPOSITORY)
    private readonly mapRepository: MapRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(command: CreateMapLevelCommand): Promise<void> {
    const map = await this.mapRepository.load(command.campaignId);

    map.createLevel(
      command.mapLevelId,
      command.name,
      command.parentId,
      this.clock,
    );

    await this.mapRepository.save(map);

    this.logger.log(
      `MapLevelCreated event persisted for level ${command.mapLevelId} in campaign ${command.campaignId}`,
    );
  }
}
