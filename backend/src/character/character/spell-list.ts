import { DomainException } from '../../shared/exceptions/domain.exception.js';

export class InvalidSpellListException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static tooMany(max: number): InvalidSpellListException {
    return new InvalidSpellListException(
      `Spell list cannot contain more than ${max} spells.`,
    );
  }

  static spellNameTooLong(
    spellName: string,
    max: number,
  ): InvalidSpellListException {
    return new InvalidSpellListException(
      `Spell name "${spellName}" exceeds maximum length of ${max} characters.`,
    );
  }

  static duplicateSpell(spellName: string): InvalidSpellListException {
    return new InvalidSpellListException(
      `Duplicate spell name: "${spellName}".`,
    );
  }
}

export class SpellList {
  private static readonly MAX_SPELLS = 20;
  private static readonly MAX_SPELL_NAME_LENGTH = 50;

  private constructor(private readonly spells: string[]) {}

  static create(spells: string[]): SpellList {
    if (spells.length > SpellList.MAX_SPELLS) {
      throw InvalidSpellListException.tooMany(SpellList.MAX_SPELLS);
    }

    const seen = new Set<string>();
    for (const spell of spells) {
      if (spell.length > SpellList.MAX_SPELL_NAME_LENGTH) {
        throw InvalidSpellListException.spellNameTooLong(
          spell,
          SpellList.MAX_SPELL_NAME_LENGTH,
        );
      }
      const normalized = spell.toLowerCase();
      if (seen.has(normalized)) {
        throw InvalidSpellListException.duplicateSpell(spell);
      }
      seen.add(normalized);
    }

    return new SpellList([...spells]);
  }

  static empty(): SpellList {
    return new SpellList([]);
  }

  toArray(): string[] {
    return [...this.spells];
  }

  equals(other: SpellList | null | undefined): boolean {
    if (!other) return false;
    if (this.spells.length !== other.spells.length) return false;
    return this.spells.every((spell, i) => spell === other.spells[i]);
  }
}
