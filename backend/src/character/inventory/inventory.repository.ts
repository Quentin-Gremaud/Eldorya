import type { Inventory } from './inventory.aggregate.js';

export interface InventoryRepository {
  saveNew(inventory: Inventory): Promise<void>;
  save(inventory: Inventory): Promise<void>;
  load(characterId: string): Promise<Inventory>;
}

export const INVENTORY_REPOSITORY = 'INVENTORY_REPOSITORY';
