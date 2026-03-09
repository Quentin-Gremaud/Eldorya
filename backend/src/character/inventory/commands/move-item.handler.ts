import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { MoveItemCommand } from './move-item.command.js';
import type { InventoryRepository } from '../inventory.repository.js';
import { INVENTORY_REPOSITORY } from '../inventory.repository.js';
import type { Clock } from '../../../shared/clock.js';
import { CLOCK } from '../../../shared/clock.js';

@CommandHandler(MoveItemCommand)
export class MoveItemHandler
  implements ICommandHandler<MoveItemCommand>
{
  private readonly logger = new Logger(MoveItemHandler.name);

  constructor(
    @Inject(INVENTORY_REPOSITORY)
    private readonly inventoryRepository: InventoryRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(command: MoveItemCommand): Promise<void> {
    const inventory = await this.inventoryRepository.load(command.characterId);

    inventory.moveItem(command.itemId, command.toPosition, this.clock);

    await this.inventoryRepository.save(inventory);

    this.logger.log(
      `ItemMoved event persisted for character ${command.characterId}, item ${command.itemId}`,
    );
  }
}
