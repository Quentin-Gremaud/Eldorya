export class CreateMapLevelCommand {
  constructor(
    public readonly campaignId: string,
    public readonly mapLevelId: string,
    public readonly name: string,
    public readonly parentId: string | null,
  ) {}
}
