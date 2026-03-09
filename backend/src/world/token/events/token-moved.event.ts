export class TokenMoved {
  readonly type = 'TokenMoved' as const;

  constructor(
    public readonly campaignId: string,
    public readonly mapLevelId: string,
    public readonly tokenId: string,
    public readonly x: number,
    public readonly y: number,
    public readonly movedAt: string,
  ) {}
}
