import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { EmitInventoryModifiedByGmCommand } from './emit-inventory-modified-by-gm.command.js';
import type { InventoryRepository } from '../inventory.repository.js';
import { INVENTORY_REPOSITORY } from '../inventory.repository.js';
import type { Clock } from '../../../shared/clock.js';
import { CLOCK } from '../../../shared/clock.js';

@CommandHandler(EmitInventoryModifiedByGmCommand)
export class EmitInventoryModifiedByGmHandler
  implements ICommandHandler<EmitInventoryModifiedByGmCommand>
{
  private readonly logger = new Logger(EmitInventoryModifiedByGmHandler.name);

  constructor(
    @Inject(INVENTORY_REPOSITORY)
    private readonly inventoryRepository: InventoryRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(command: EmitInventoryModifiedByGmCommand): Promise<void> {
    const inventory = await this.inventoryRepository.load(command.characterId);

    inventory.recordGmModification(
      command.gmId,
      command.modificationType,
      command.itemId,
      command.details,
      this.clock,
    );

    await this.inventoryRepository.save(inventory);

    this.logger.log(
      `InventoryModifiedByGM event persisted for character ${command.characterId}, type: ${command.modificationType}`,
    );
  }
}
