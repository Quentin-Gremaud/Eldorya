export class TokenRemoved {
  readonly type = 'TokenRemoved' as const;

  constructor(
    public readonly campaignId: string,
    public readonly mapLevelId: string,
    public readonly tokenId: string,
    public readonly removedAt: string,
  ) {}
}
