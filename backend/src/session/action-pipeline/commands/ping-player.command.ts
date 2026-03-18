export class PingPlayerCommand {
  constructor(
    public readonly sessionId: string,
    public readonly campaignId: string,
    public readonly callerUserId: string,
    public readonly playerId: string,
  ) {}
}
