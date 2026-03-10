export class FogZoneHidden {
  readonly type = 'FogZoneHidden' as const;

  constructor(
    public readonly campaignId: string,
    public readonly playerId: string,
    public readonly fogZoneId: string,
    public readonly mapLevelId: string,
    public readonly hiddenAt: string,
  ) {}
}
