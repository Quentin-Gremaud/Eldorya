import { CharacterName } from './character-name.js';
import { CharacterRace } from './character-race.js';
import { CharacterClass } from './character-class.js';
import { CharacterBackground } from './character-background.js';
import { CharacterStats, type CharacterStatsData } from './character-stats.js';
import { SpellList } from './spell-list.js';
import { DomainException } from '../../shared/exceptions/domain.exception.js';

export class EmptyCharacterModificationException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static create(): EmptyCharacterModificationException {
    return new EmptyCharacterModificationException(
      'At least one modification field must be provided.',
    );
  }
}

export interface CharacterModificationInput {
  name?: string;
  race?: string;
  characterClass?: string;
  background?: string;
  stats?: CharacterStatsData;
  spells?: string[];
}

export class CharacterModification {
  private constructor(
    private readonly _name: CharacterName | undefined,
    private readonly _race: CharacterRace | undefined,
    private readonly _characterClass: CharacterClass | undefined,
    private readonly _background: CharacterBackground | undefined,
    private readonly _stats: CharacterStats | undefined,
    private readonly _spells: SpellList | undefined,
  ) {}

  static create(input: CharacterModificationInput): CharacterModification {
    const hasAnyField =
      input.name !== undefined ||
      input.race !== undefined ||
      input.characterClass !== undefined ||
      input.background !== undefined ||
      input.stats !== undefined ||
      input.spells !== undefined;

    if (!hasAnyField) {
      throw EmptyCharacterModificationException.create();
    }

    const name =
      input.name !== undefined
        ? CharacterName.fromString(input.name)
        : undefined;
    const race =
      input.race !== undefined
        ? CharacterRace.fromString(input.race)
        : undefined;
    const characterClass =
      input.characterClass !== undefined
        ? CharacterClass.fromString(input.characterClass)
        : undefined;
    const background =
      input.background !== undefined
        ? CharacterBackground.fromString(input.background)
        : undefined;
    const stats =
      input.stats !== undefined ? CharacterStats.create(input.stats) : undefined;
    const spells =
      input.spells !== undefined ? SpellList.create(input.spells) : undefined;

    return new CharacterModification(
      name,
      race,
      characterClass,
      background,
      stats,
      spells,
    );
  }

  getName(): CharacterName | undefined {
    return this._name;
  }

  getRace(): CharacterRace | undefined {
    return this._race;
  }

  getCharacterClass(): CharacterClass | undefined {
    return this._characterClass;
  }

  getBackground(): CharacterBackground | undefined {
    return this._background;
  }

  getStats(): CharacterStats | undefined {
    return this._stats;
  }

  getSpells(): SpellList | undefined {
    return this._spells;
  }

  getModifiedFields(): string[] {
    const fields: string[] = [];
    if (this._name !== undefined) fields.push('name');
    if (this._race !== undefined) fields.push('race');
    if (this._characterClass !== undefined) fields.push('characterClass');
    if (this._background !== undefined) fields.push('background');
    if (this._stats !== undefined) fields.push('stats');
    if (this._spells !== undefined) fields.push('spells');
    return fields;
  }
}
