export class InitializeFogStateCommand {
  constructor(
    public readonly campaignId: string,
    public readonly playerId: string,
  ) {}
}
