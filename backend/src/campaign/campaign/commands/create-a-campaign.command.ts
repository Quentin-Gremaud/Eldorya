export class CreateACampaignCommand {
  constructor(
    public readonly campaignId: string,
    public readonly name: string,
    public readonly description: string,
    public readonly userId: string,
  ) {}
}
