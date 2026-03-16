export class ChangeSessionModeCommand {
  constructor(
    public readonly sessionId: string,
    public readonly campaignId: string,
    public readonly gmUserId: string,
    public readonly newMode: string,
  ) {}
}
