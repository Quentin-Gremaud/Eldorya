export class SendACampaignAnnouncementCommand {
  constructor(
    public readonly announcementId: string,
    public readonly campaignId: string,
    public readonly content: string,
    public readonly userId: string,
  ) {}
}
