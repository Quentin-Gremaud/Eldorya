export class ItemRemovedFromInventory {
  readonly type = 'ItemRemovedFromInventory' as const;

  constructor(
    public readonly characterId: string,
    public readonly itemId: string,
    public readonly itemName: string,
    public readonly itemWeight: number,
    public readonly fromSlot: string,
    public readonly removedAt: string,
  ) {}
}
