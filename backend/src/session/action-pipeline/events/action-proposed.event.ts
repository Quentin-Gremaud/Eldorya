export class ActionProposed {
  readonly type = 'ActionProposed' as const;

  constructor(
    public readonly actionId: string,
    public readonly sessionId: string,
    public readonly campaignId: string,
    public readonly playerId: string,
    public readonly actionType: string,
    public readonly description: string,
    public readonly target: string | null,
    public readonly proposedAt: string,
  ) {}
}
