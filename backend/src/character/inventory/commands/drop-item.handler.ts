import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { DropItemCommand } from './drop-item.command.js';
import type { InventoryRepository } from '../inventory.repository.js';
import { INVENTORY_REPOSITORY } from '../inventory.repository.js';
import type { Clock } from '../../../shared/clock.js';
import { CLOCK } from '../../../shared/clock.js';

@CommandHandler(DropItemCommand)
export class DropItemHandler
  implements ICommandHandler<DropItemCommand>
{
  private readonly logger = new Logger(DropItemHandler.name);

  constructor(
    @Inject(INVENTORY_REPOSITORY)
    private readonly inventoryRepository: InventoryRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(command: DropItemCommand): Promise<void> {
    const inventory = await this.inventoryRepository.load(command.characterId);

    inventory.dropItem(command.itemId, this.clock);

    await this.inventoryRepository.save(inventory);

    this.logger.log(
      `ItemDropped event persisted for character ${command.characterId}, item ${command.itemId}`,
    );
  }
}
