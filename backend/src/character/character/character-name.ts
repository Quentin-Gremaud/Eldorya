import { InvalidCharacterNameException } from './exceptions/invalid-character-name.exception.js';

export class CharacterName {
  private static readonly MAX_LENGTH = 50;

  private constructor(private readonly value: string) {}

  static fromString(name: string): CharacterName {
    if (!name || !name.trim()) {
      throw InvalidCharacterNameException.create(name ?? '');
    }
    const trimmed = name.trim();
    if (trimmed.length > CharacterName.MAX_LENGTH) {
      throw InvalidCharacterNameException.create(trimmed);
    }
    return new CharacterName(trimmed);
  }

  toString(): string {
    return this.value;
  }

  equals(other: CharacterName | null | undefined): boolean {
    if (!other) return false;
    return this.value === other.value;
  }
}
