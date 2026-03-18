export class ReorderActionQueueCommand {
  constructor(
    public readonly sessionId: string,
    public readonly campaignId: string,
    public readonly orderedActionIds: string[],
    public readonly callerUserId: string,
  ) {}
}
