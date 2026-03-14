export class LinkLocationTokenCommand {
  constructor(
    public readonly campaignId: string,
    public readonly tokenId: string,
    public readonly destinationMapLevelId: string,
  ) {}
}
