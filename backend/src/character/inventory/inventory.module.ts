import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AddItemToInventoryHandler } from './commands/add-item-to-inventory.handler.js';
import { RemoveItemFromInventoryHandler } from './commands/remove-item-from-inventory.handler.js';
import { EmitInventoryModifiedByGmHandler } from './commands/emit-inventory-modified-by-gm.handler.js';
import { EquipItemHandler } from './commands/equip-item.handler.js';
import { UnequipItemHandler } from './commands/unequip-item.handler.js';
import { MoveItemHandler } from './commands/move-item.handler.js';
import { DropItemHandler } from './commands/drop-item.handler.js';
import { ModifyMaxCapacityHandler } from './commands/modify-max-capacity.handler.js';
import { KurrentDbInventoryRepository } from '../../infrastructure/character/kurrentdb-inventory.repository.js';
import { INVENTORY_REPOSITORY } from './inventory.repository.js';
import { SystemClock, CLOCK } from '../../shared/clock.js';

@Module({
  imports: [CqrsModule],
  providers: [
    AddItemToInventoryHandler,
    RemoveItemFromInventoryHandler,
    EmitInventoryModifiedByGmHandler,
    EquipItemHandler,
    UnequipItemHandler,
    MoveItemHandler,
    DropItemHandler,
    ModifyMaxCapacityHandler,
    {
      provide: INVENTORY_REPOSITORY,
      useClass: KurrentDbInventoryRepository,
    },
    { provide: CLOCK, useClass: SystemClock },
  ],
})
export class InventoryDomainModule {}
