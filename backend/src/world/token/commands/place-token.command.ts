export class PlaceTokenCommand {
  constructor(
    public readonly campaignId: string,
    public readonly tokenId: string,
    public readonly mapLevelId: string,
    public readonly x: number,
    public readonly y: number,
    public readonly tokenType: string,
    public readonly label: string,
    public readonly destinationMapLevelId?: string,
  ) {}
}
