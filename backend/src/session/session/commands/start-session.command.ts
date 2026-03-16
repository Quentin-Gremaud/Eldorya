export class StartSessionCommand {
  constructor(
    public readonly sessionId: string,
    public readonly campaignId: string,
    public readonly gmUserId: string,
  ) {}
}
