export class SessionStarted {
  readonly type = 'SessionStarted' as const;

  constructor(
    public readonly sessionId: string,
    public readonly campaignId: string,
    public readonly gmUserId: string,
    public readonly mode: string,
    public readonly startedAt: string,
  ) {}
}
