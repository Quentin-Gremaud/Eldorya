export class HideFogZoneToAllCommand {
  constructor(
    public readonly campaignId: string,
    public readonly fogZoneId: string,
  ) {}
}
