export class MapLevelBackgroundSet {
  readonly type = 'MapLevelBackgroundSet' as const;

  constructor(
    public readonly campaignId: string,
    public readonly mapLevelId: string,
    public readonly backgroundImageUrl: string,
    public readonly previousBackgroundImageUrl: string | null,
    public readonly setAt: string,
  ) {}
}
