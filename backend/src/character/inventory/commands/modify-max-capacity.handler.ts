import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { ModifyMaxCapacityCommand } from './modify-max-capacity.command.js';
import type { InventoryRepository } from '../inventory.repository.js';
import { INVENTORY_REPOSITORY } from '../inventory.repository.js';
import type { Clock } from '../../../shared/clock.js';
import { CLOCK } from '../../../shared/clock.js';

@CommandHandler(ModifyMaxCapacityCommand)
export class ModifyMaxCapacityHandler
  implements ICommandHandler<ModifyMaxCapacityCommand>
{
  private readonly logger = new Logger(ModifyMaxCapacityHandler.name);

  constructor(
    @Inject(INVENTORY_REPOSITORY)
    private readonly inventoryRepository: InventoryRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(command: ModifyMaxCapacityCommand): Promise<void> {
    const inventory = await this.inventoryRepository.load(command.characterId);

    inventory.modifyMaxCapacity(
      command.newMaxCapacity,
      command.userId,
      this.clock,
    );

    await this.inventoryRepository.save(inventory);

    this.logger.log(
      `MaxCapacityModified event persisted for character ${command.characterId}, new capacity: ${command.newMaxCapacity}`,
    );
  }
}
