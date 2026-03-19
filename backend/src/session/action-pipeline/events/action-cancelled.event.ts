export class ActionCancelled {
  readonly type = 'ActionCancelled' as const;

  constructor(
    public readonly actionId: string,
    public readonly sessionId: string,
    public readonly campaignId: string,
    public readonly playerId: string,
    public readonly cancelledAt: string,
  ) {}
}
