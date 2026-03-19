export class CancelActionCommand {
  constructor(
    public readonly actionId: string,
    public readonly sessionId: string,
    public readonly campaignId: string,
    public readonly callerUserId: string,
  ) {}
}
