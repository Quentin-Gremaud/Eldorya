export class ProposeActionCommand {
  constructor(
    public readonly actionId: string,
    public readonly sessionId: string,
    public readonly campaignId: string,
    public readonly playerId: string,
    public readonly actionType: string,
    public readonly description: string,
    public readonly target: string | null,
  ) {}
}
