export class CharacterApproved {
  readonly type = 'CharacterApproved' as const;

  constructor(
    public readonly characterId: string,
    public readonly approvedBy: string,
    public readonly characterName: string,
    public readonly approvedAt: string,
  ) {}
}
