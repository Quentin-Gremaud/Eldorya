export class RejectActionCommand {
  constructor(
    public readonly actionId: string,
    public readonly sessionId: string,
    public readonly campaignId: string,
    public readonly callerUserId: string,
    public readonly feedback: string,
  ) {}
}
