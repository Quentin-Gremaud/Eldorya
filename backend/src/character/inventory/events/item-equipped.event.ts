export class ItemEquipped {
  readonly type = 'ItemEquipped' as const;

  constructor(
    public readonly characterId: string,
    public readonly itemId: string,
    public readonly fromBackpackPosition: number,
    public readonly toEquipmentSlot: string,
    public readonly equippedAt: string,
  ) {}
}
