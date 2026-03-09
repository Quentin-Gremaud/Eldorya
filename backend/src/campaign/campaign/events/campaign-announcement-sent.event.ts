export class CampaignAnnouncementSent {
  readonly type = 'CampaignAnnouncementSent' as const;

  constructor(
    public readonly announcementId: string,
    public readonly campaignId: string,
    public readonly content: string,
    public readonly gmUserId: string,
    public readonly gmDisplayName: string,
    public readonly timestamp: string,
  ) {}
}
