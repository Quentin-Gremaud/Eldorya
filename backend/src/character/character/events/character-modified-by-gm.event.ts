export interface CharacterModifications {
  name?: string;
  race?: string;
  characterClass?: string;
  background?: string;
  stats?: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  spells?: string[];
}

export class CharacterModifiedByGM {
  readonly type = 'CharacterModifiedByGM' as const;

  constructor(
    public readonly characterId: string,
    public readonly campaignId: string,
    public readonly modifiedBy: string,
    public readonly characterName: string,
    public readonly modifications: CharacterModifications,
    public readonly previousValues: CharacterModifications,
    public readonly modifiedFields: string[],
    public readonly modifiedAt: string,
  ) {}
}
