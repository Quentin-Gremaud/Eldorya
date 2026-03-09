import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { EquipItemCommand } from './equip-item.command.js';
import type { InventoryRepository } from '../inventory.repository.js';
import { INVENTORY_REPOSITORY } from '../inventory.repository.js';
import type { Clock } from '../../../shared/clock.js';
import { CLOCK } from '../../../shared/clock.js';

@CommandHandler(EquipItemCommand)
export class EquipItemHandler
  implements ICommandHandler<EquipItemCommand>
{
  private readonly logger = new Logger(EquipItemHandler.name);

  constructor(
    @Inject(INVENTORY_REPOSITORY)
    private readonly inventoryRepository: InventoryRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(command: EquipItemCommand): Promise<void> {
    const inventory = await this.inventoryRepository.load(command.characterId);

    inventory.equipItem(command.itemId, command.slotType, this.clock);

    await this.inventoryRepository.save(inventory);

    this.logger.log(
      `ItemEquipped event persisted for character ${command.characterId}, item ${command.itemId}`,
    );
  }
}
