export class HideFogZoneCommand {
  constructor(
    public readonly campaignId: string,
    public readonly playerId: string,
    public readonly fogZoneId: string,
  ) {}
}
