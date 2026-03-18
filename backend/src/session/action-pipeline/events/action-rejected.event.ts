export class ActionRejected {
  readonly type = 'ActionRejected' as const;

  constructor(
    public readonly actionId: string,
    public readonly sessionId: string,
    public readonly campaignId: string,
    public readonly gmUserId: string,
    public readonly feedback: string,
    public readonly rejectedAt: string,
  ) {}
}
