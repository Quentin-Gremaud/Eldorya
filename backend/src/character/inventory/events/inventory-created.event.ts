export class InventoryCreated {
  readonly type = 'InventoryCreated' as const;

  constructor(
    public readonly characterId: string,
    public readonly campaignId: string,
    public readonly maxCapacity: number,
    public readonly createdAt: string,
  ) {}
}
