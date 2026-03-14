export class LocationTokenLinked {
  readonly type = 'LocationTokenLinked' as const;

  constructor(
    public readonly campaignId: string,
    public readonly tokenId: string,
    public readonly destinationMapLevelId: string,
    public readonly linkedAt: string,
  ) {}
}
