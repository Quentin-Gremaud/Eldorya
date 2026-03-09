import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { AddItemToInventoryCommand } from './add-item-to-inventory.command.js';
import type { InventoryRepository } from '../inventory.repository.js';
import { INVENTORY_REPOSITORY } from '../inventory.repository.js';
import type { Clock } from '../../../shared/clock.js';
import { CLOCK } from '../../../shared/clock.js';

@CommandHandler(AddItemToInventoryCommand)
export class AddItemToInventoryHandler
  implements ICommandHandler<AddItemToInventoryCommand>
{
  private readonly logger = new Logger(AddItemToInventoryHandler.name);

  constructor(
    @Inject(INVENTORY_REPOSITORY)
    private readonly inventoryRepository: InventoryRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(command: AddItemToInventoryCommand): Promise<void> {
    const inventory = await this.inventoryRepository.load(command.characterId);

    inventory.addItem(command.item, this.clock);
    inventory.recordGmModification(
      command.userId,
      'add-item',
      command.item.id,
      { itemName: command.item.name, weight: command.item.weight, slotType: command.item.slotType },
      this.clock,
    );

    await this.inventoryRepository.save(inventory);

    this.logger.log(
      `ItemAddedToInventory event persisted for character ${command.characterId}, item ${command.item.name}`,
    );
  }
}
