export class RevealFogZoneCommand {
  constructor(
    public readonly campaignId: string,
    public readonly playerId: string,
    public readonly fogZoneId: string,
    public readonly mapLevelId: string,
    public readonly x: number,
    public readonly y: number,
    public readonly width: number,
    public readonly height: number,
  ) {}
}
