export class CharacterModificationRejected {
  readonly type = 'CharacterModificationRejected' as const;

  constructor(
    public readonly characterId: string,
    public readonly campaignId: string,
    public readonly rejectedBy: string,
    public readonly characterName: string,
    public readonly reason: string,
    public readonly rejectedAt: string,
  ) {}
}
