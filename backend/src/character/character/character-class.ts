import { InvalidCharacterClassException } from './exceptions/invalid-character-class.exception.js';

export class CharacterClass {
  private static readonly ALLOWED_CLASSES = [
    'Warrior',
    'Mage',
    'Rogue',
    'Cleric',
    'Ranger',
    'Paladin',
    'Bard',
    'Warlock',
    'Druid',
    'Monk',
  ];

  private constructor(private readonly value: string) {}

  static fromString(characterClass: string): CharacterClass {
    if (!CharacterClass.ALLOWED_CLASSES.includes(characterClass)) {
      throw InvalidCharacterClassException.create(characterClass);
    }
    return new CharacterClass(characterClass);
  }

  toString(): string {
    return this.value;
  }

  equals(other: CharacterClass | null | undefined): boolean {
    if (!other) return false;
    return this.value === other.value;
  }
}
