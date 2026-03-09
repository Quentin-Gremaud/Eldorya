import type { InventoryItemData } from '../inventory-item.js';

export class AddItemToInventoryCommand {
  constructor(
    public readonly characterId: string,
    public readonly item: InventoryItemData,
    public readonly userId: string,
  ) {}
}
