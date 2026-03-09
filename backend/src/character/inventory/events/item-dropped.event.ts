export class ItemDropped {
  readonly type = 'ItemDropped' as const;

  constructor(
    public readonly characterId: string,
    public readonly itemId: string,
    public readonly itemName: string,
    public readonly itemWeight: number,
    public readonly fromSlot: string,
    public readonly droppedAt: string,
  ) {}
}
