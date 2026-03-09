import { InvalidCharacterStatsException } from './exceptions/invalid-character-stats.exception.js';

export interface CharacterStatsData {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export class CharacterStats {
  private static readonly MIN_VALUE = 1;
  private static readonly MAX_VALUE = 20;

  private constructor(
    private readonly strength: number,
    private readonly dexterity: number,
    private readonly constitution: number,
    private readonly intelligence: number,
    private readonly wisdom: number,
    private readonly charisma: number,
  ) {}

  static create(params: CharacterStatsData): CharacterStats {
    const stats: [string, number][] = [
      ['strength', params.strength],
      ['dexterity', params.dexterity],
      ['constitution', params.constitution],
      ['intelligence', params.intelligence],
      ['wisdom', params.wisdom],
      ['charisma', params.charisma],
    ];

    for (const [name, value] of stats) {
      if (!Number.isInteger(value)) {
        throw InvalidCharacterStatsException.create(
          `${name} must be an integer, got ${value}`,
        );
      }
      if (
        value < CharacterStats.MIN_VALUE ||
        value > CharacterStats.MAX_VALUE
      ) {
        throw InvalidCharacterStatsException.create(
          `${name} must be between ${CharacterStats.MIN_VALUE} and ${CharacterStats.MAX_VALUE}, got ${value}`,
        );
      }
    }

    return new CharacterStats(
      params.strength,
      params.dexterity,
      params.constitution,
      params.intelligence,
      params.wisdom,
      params.charisma,
    );
  }

  static fromPrimitives(data: CharacterStatsData): CharacterStats {
    return CharacterStats.create(data);
  }

  toPrimitives(): CharacterStatsData {
    return {
      strength: this.strength,
      dexterity: this.dexterity,
      constitution: this.constitution,
      intelligence: this.intelligence,
      wisdom: this.wisdom,
      charisma: this.charisma,
    };
  }

  equals(other: CharacterStats | null | undefined): boolean {
    if (!other) return false;
    const a = this.toPrimitives();
    const b = other.toPrimitives();
    return (
      a.strength === b.strength &&
      a.dexterity === b.dexterity &&
      a.constitution === b.constitution &&
      a.intelligence === b.intelligence &&
      a.wisdom === b.wisdom &&
      a.charisma === b.charisma
    );
  }
}
