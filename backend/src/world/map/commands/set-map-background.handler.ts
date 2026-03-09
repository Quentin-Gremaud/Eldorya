import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { SetMapBackgroundCommand } from './set-map-background.command.js';
import type { MapRepository } from '../map.repository.js';
import { MAP_REPOSITORY } from '../map.repository.js';
import type { Clock } from '../../../shared/clock.js';
import { CLOCK } from '../../../shared/clock.js';

@CommandHandler(SetMapBackgroundCommand)
export class SetMapBackgroundHandler
  implements ICommandHandler<SetMapBackgroundCommand>
{
  private readonly logger = new Logger(SetMapBackgroundHandler.name);

  constructor(
    @Inject(MAP_REPOSITORY)
    private readonly mapRepository: MapRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(command: SetMapBackgroundCommand): Promise<void> {
    const map = await this.mapRepository.load(command.campaignId);

    map.setBackground(
      command.mapLevelId,
      command.backgroundImageUrl,
      this.clock,
    );

    await this.mapRepository.save(map);

    this.logger.log(
      `MapLevelBackgroundSet event persisted for level ${command.mapLevelId} in campaign ${command.campaignId}`,
    );
  }
}
