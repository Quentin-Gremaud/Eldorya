export class SessionModeChanged {
  readonly type = 'SessionModeChanged' as const;

  constructor(
    public readonly sessionId: string,
    public readonly campaignId: string,
    public readonly newMode: string,
    public readonly changedAt: string,
  ) {}
}
