export class ActionQueueReordered {
  readonly type = 'ActionQueueReordered' as const;

  constructor(
    public readonly sessionId: string,
    public readonly campaignId: string,
    public readonly orderedActionIds: string[],
    public readonly gmUserId: string,
    public readonly reorderedAt: string,
  ) {}
}
