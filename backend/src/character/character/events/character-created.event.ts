export class CharacterCreated {
  readonly type = 'CharacterCreated' as const;

  constructor(
    public readonly characterId: string,
    public readonly userId: string,
    public readonly campaignId: string,
    public readonly name: string,
    public readonly race: string,
    public readonly characterClass: string,
    public readonly background: string,
    public readonly stats: {
      strength: number;
      dexterity: number;
      constitution: number;
      intelligence: number;
      wisdom: number;
      charisma: number;
    },
    public readonly spells: string[],
    public readonly status: string,
    public readonly createdAt: string,
  ) {}
}
