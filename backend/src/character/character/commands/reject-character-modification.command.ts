export class RejectCharacterModificationCommand {
  constructor(
    public readonly characterId: string,
    public readonly campaignId: string,
    public readonly rejectedBy: string,
    public readonly reason: string,
  ) {}
}
