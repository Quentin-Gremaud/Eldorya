export class RemoveTokenCommand {
  constructor(
    public readonly campaignId: string,
    public readonly tokenId: string,
  ) {}
}
