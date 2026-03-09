export class ItemMoved {
  readonly type = 'ItemMoved' as const;

  constructor(
    public readonly characterId: string,
    public readonly itemId: string,
    public readonly fromPosition: number,
    public readonly toPosition: number,
    public readonly movedAt: string,
  ) {}
}
