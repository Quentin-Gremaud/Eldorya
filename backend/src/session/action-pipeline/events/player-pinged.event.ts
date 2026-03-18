export class PlayerPinged {
  readonly type = 'PlayerPinged' as const;

  constructor(
    public readonly sessionId: string,
    public readonly campaignId: string,
    public readonly playerId: string,
    public readonly gmUserId: string,
    public readonly pingedAt: string,
  ) {}
}
