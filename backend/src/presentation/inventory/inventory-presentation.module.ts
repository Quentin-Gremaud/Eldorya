import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { GetInventoryController } from './controllers/get-inventory.controller.js';
import { AddAnItemToInventoryController } from './controllers/add-an-item-to-inventory.controller.js';
import { RemoveAnItemFromInventoryController } from './controllers/remove-an-item-from-inventory.controller.js';
import { EquipItemController } from './controllers/equip-item.controller.js';
import { UnequipItemController } from './controllers/unequip-item.controller.js';
import { MoveItemController } from './controllers/move-item.controller.js';
import { DropItemController } from './controllers/drop-item.controller.js';
import { GmEquipItemController } from './controllers/gm-equip-item.controller.js';
import { GmUnequipItemController } from './controllers/gm-unequip-item.controller.js';
import { GmMoveItemController } from './controllers/gm-move-item.controller.js';
import { ModifyMaxCapacityController } from './controllers/modify-max-capacity.controller.js';
import { InventoryFinder } from './finders/inventory.finder.js';
import { InventoryGmFinder } from './finders/inventory-gm.finder.js';
import { InventoryProjection } from './projections/inventory.projection.js';

@Module({
  imports: [CqrsModule],
  controllers: [
    // Route order: GET before POST, static before parameterized
    GetInventoryController,       // GET /characters/:characterId/inventory
    AddAnItemToInventoryController, // POST /campaigns/:campaignId/characters/:characterId/inventory/add-item
    RemoveAnItemFromInventoryController, // POST /campaigns/:campaignId/characters/:characterId/inventory/remove-item
    EquipItemController,          // POST /characters/:characterId/inventory/equip
    UnequipItemController,        // POST /characters/:characterId/inventory/unequip
    MoveItemController,           // POST /characters/:characterId/inventory/move
    DropItemController,           // POST /characters/:characterId/inventory/drop
    GmEquipItemController,        // POST /campaigns/:campaignId/characters/:characterId/inventory/equip
    GmUnequipItemController,      // POST /campaigns/:campaignId/characters/:characterId/inventory/unequip
    GmMoveItemController,         // POST /campaigns/:campaignId/characters/:characterId/inventory/move
    ModifyMaxCapacityController,  // POST /campaigns/:campaignId/characters/:characterId/inventory/modify-max-capacity
  ],
  providers: [
    InventoryFinder,
    InventoryGmFinder,
    InventoryProjection,
  ],
})
export class InventoryPresentationModule {}
