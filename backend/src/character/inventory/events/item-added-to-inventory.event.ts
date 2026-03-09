import type { InventoryItemData } from '../inventory-item.js';

export class ItemAddedToInventory {
  readonly type = 'ItemAddedToInventory' as const;

  constructor(
    public readonly characterId: string,
    public readonly item: InventoryItemData,
    public readonly backpackPosition: number,
    public readonly addedAt: string,
  ) {}
}
