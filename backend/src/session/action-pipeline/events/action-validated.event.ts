export class ActionValidated {
  readonly type = 'ActionValidated' as const;

  constructor(
    public readonly actionId: string,
    public readonly sessionId: string,
    public readonly campaignId: string,
    public readonly gmUserId: string,
    public readonly narrativeNote: string | null,
    public readonly validatedAt: string,
  ) {}
}
