export class TokenPlaced {
  readonly type = 'TokenPlaced' as const;

  constructor(
    public readonly campaignId: string,
    public readonly mapLevelId: string,
    public readonly tokenId: string,
    public readonly x: number,
    public readonly y: number,
    public readonly tokenType: string,
    public readonly label: string,
    public readonly placedAt: string,
  ) {}
}
