export class ItemUnequipped {
  readonly type = 'ItemUnequipped' as const;

  constructor(
    public readonly characterId: string,
    public readonly itemId: string,
    public readonly fromEquipmentSlot: string,
    public readonly toBackpackPosition: number,
    public readonly unequippedAt: string,
  ) {}
}
