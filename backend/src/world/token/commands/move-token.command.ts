export class MoveTokenCommand {
  constructor(
    public readonly campaignId: string,
    public readonly tokenId: string,
    public readonly x: number,
    public readonly y: number,
  ) {}
}
