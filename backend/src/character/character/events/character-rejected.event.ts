export class CharacterRejected {
  readonly type = 'CharacterRejected' as const;

  constructor(
    public readonly characterId: string,
    public readonly rejectedBy: string,
    public readonly characterName: string,
    public readonly reason: string,
    public readonly rejectedAt: string,
  ) {}
}
