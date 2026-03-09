export class ReactivateACampaignCommand {
  constructor(
    public readonly campaignId: string,
    public readonly userId: string,
  ) {}
}
