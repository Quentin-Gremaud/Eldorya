export class MapLevelRenamed {
  readonly type = 'MapLevelRenamed' as const;

  constructor(
    public readonly campaignId: string,
    public readonly mapLevelId: string,
    public readonly newName: string,
    public readonly renamedAt: string,
  ) {}
}
