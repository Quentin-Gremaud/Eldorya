export class CampaignArchived {
  readonly type = 'CampaignArchived' as const;

  constructor(
    public readonly campaignId: string,
    public readonly gmUserId: string,
    public readonly archivedAt: string,
  ) {}
}
