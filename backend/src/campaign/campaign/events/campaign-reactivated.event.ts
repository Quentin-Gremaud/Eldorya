export class CampaignReactivated {
  readonly type = 'CampaignReactivated' as const;

  constructor(
    public readonly campaignId: string,
    public readonly gmUserId: string,
    public readonly reactivatedAt: string,
  ) {}
}
