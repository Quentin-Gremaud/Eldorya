export class ApproveCharacterModificationCommand {
  constructor(
    public readonly characterId: string,
    public readonly campaignId: string,
    public readonly approvedBy: string,
  ) {}
}
