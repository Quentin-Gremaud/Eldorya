import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { RemoveItemFromInventoryCommand } from './remove-item-from-inventory.command.js';
import type { InventoryRepository } from '../inventory.repository.js';
import { INVENTORY_REPOSITORY } from '../inventory.repository.js';
import type { Clock } from '../../../shared/clock.js';
import { CLOCK } from '../../../shared/clock.js';

@CommandHandler(RemoveItemFromInventoryCommand)
export class RemoveItemFromInventoryHandler
  implements ICommandHandler<RemoveItemFromInventoryCommand>
{
  private readonly logger = new Logger(RemoveItemFromInventoryHandler.name);

  constructor(
    @Inject(INVENTORY_REPOSITORY)
    private readonly inventoryRepository: InventoryRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(command: RemoveItemFromInventoryCommand): Promise<void> {
    const inventory = await this.inventoryRepository.load(command.characterId);

    inventory.removeItem(command.itemId, this.clock);
    inventory.recordGmModification(
      command.userId,
      'remove-item',
      command.itemId,
      {},
      this.clock,
    );

    await this.inventoryRepository.save(inventory);

    this.logger.log(
      `ItemRemovedFromInventory event persisted for character ${command.characterId}, item ${command.itemId}`,
    );
  }
}
