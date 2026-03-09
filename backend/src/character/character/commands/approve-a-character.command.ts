export class ApproveACharacterCommand {
  constructor(
    public readonly characterId: string,
    public readonly approvedBy: string,
  ) {}
}
