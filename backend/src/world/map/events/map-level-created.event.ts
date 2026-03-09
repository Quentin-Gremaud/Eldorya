export class MapLevelCreated {
  readonly type = 'MapLevelCreated' as const;

  constructor(
    public readonly campaignId: string,
    public readonly mapLevelId: string,
    public readonly name: string,
    public readonly parentId: string | null,
    public readonly depth: number,
    public readonly createdAt: string,
  ) {}
}
