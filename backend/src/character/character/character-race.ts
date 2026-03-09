import { InvalidCharacterRaceException } from './exceptions/invalid-character-race.exception.js';

export class CharacterRace {
  private static readonly ALLOWED_RACES = [
    'Human',
    'Elf',
    'Dwarf',
    'Halfling',
    'Orc',
    'Gnome',
    'Half-Elf',
    'Tiefling',
    'Dragonborn',
  ];

  private constructor(private readonly value: string) {}

  static fromString(race: string): CharacterRace {
    if (!CharacterRace.ALLOWED_RACES.includes(race)) {
      throw InvalidCharacterRaceException.create(race);
    }
    return new CharacterRace(race);
  }

  toString(): string {
    return this.value;
  }

  equals(other: CharacterRace | null | undefined): boolean {
    if (!other) return false;
    return this.value === other.value;
  }
}
