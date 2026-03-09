export class SetMapBackgroundCommand {
  constructor(
    public readonly campaignId: string,
    public readonly mapLevelId: string,
    public readonly backgroundImageUrl: string,
  ) {}
}
