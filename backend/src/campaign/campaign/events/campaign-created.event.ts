export class CampaignCreated {
  readonly type = 'CampaignCreated' as const;

  constructor(
    public readonly campaignId: string,
    public readonly name: string,
    public readonly description: string,
    public readonly gmUserId: string,
    public readonly status: string,
    public readonly createdAt: string,
  ) {}
}
