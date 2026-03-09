import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { UnequipItemCommand } from './unequip-item.command.js';
import type { InventoryRepository } from '../inventory.repository.js';
import { INVENTORY_REPOSITORY } from '../inventory.repository.js';
import type { Clock } from '../../../shared/clock.js';
import { CLOCK } from '../../../shared/clock.js';

@CommandHandler(UnequipItemCommand)
export class UnequipItemHandler
  implements ICommandHandler<UnequipItemCommand>
{
  private readonly logger = new Logger(UnequipItemHandler.name);

  constructor(
    @Inject(INVENTORY_REPOSITORY)
    private readonly inventoryRepository: InventoryRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(command: UnequipItemCommand): Promise<void> {
    const inventory = await this.inventoryRepository.load(command.characterId);

    inventory.unequipItem(command.itemId, this.clock);

    await this.inventoryRepository.save(inventory);

    this.logger.log(
      `ItemUnequipped event persisted for character ${command.characterId}, item ${command.itemId}`,
    );
  }
}
