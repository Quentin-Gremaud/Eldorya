export class RenameMapLevelCommand {
  constructor(
    public readonly campaignId: string,
    public readonly mapLevelId: string,
    public readonly newName: string,
  ) {}
}
