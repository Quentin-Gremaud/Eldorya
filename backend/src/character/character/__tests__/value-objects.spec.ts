import { CharacterName } from '../character-name.js';
import { InvalidCharacterNameException } from '../exceptions/invalid-character-name.exception.js';
import { CharacterRace } from '../character-race.js';
import { InvalidCharacterRaceException } from '../exceptions/invalid-character-race.exception.js';
import { CharacterClass } from '../character-class.js';
import { InvalidCharacterClassException } from '../exceptions/invalid-character-class.exception.js';
import {
  CharacterBackground,
  InvalidCharacterBackgroundException,
} from '../character-background.js';
import { CharacterStats } from '../character-stats.js';
import { InvalidCharacterStatsException } from '../exceptions/invalid-character-stats.exception.js';
import {
  CharacterStatus,
  InvalidCharacterStatusException,
} from '../character-status.js';
import { SpellList, InvalidSpellListException } from '../spell-list.js';

describe('CharacterName', () => {
  describe('fromString()', () => {
    it('should create a valid character name', () => {
      const name = CharacterName.fromString('Gandalf');
      expect(name.toString()).toBe('Gandalf');
    });

    it('should trim whitespace', () => {
      const name = CharacterName.fromString('  Gandalf  ');
      expect(name.toString()).toBe('Gandalf');
    });

    it('should throw for empty string', () => {
      expect(() => CharacterName.fromString('')).toThrow(
        InvalidCharacterNameException,
      );
    });

    it('should throw for whitespace-only string', () => {
      expect(() => CharacterName.fromString('   ')).toThrow(
        InvalidCharacterNameException,
      );
    });

    it('should throw for name exceeding 50 chars', () => {
      const longName = 'a'.repeat(51);
      expect(() => CharacterName.fromString(longName)).toThrow(
        InvalidCharacterNameException,
      );
    });

    it('should accept name at exactly 50 chars', () => {
      const exactName = 'a'.repeat(50);
      const name = CharacterName.fromString(exactName);
      expect(name.toString()).toBe(exactName);
    });
  });

  describe('equals()', () => {
    it('should return true for equal names', () => {
      const name1 = CharacterName.fromString('Gandalf');
      const name2 = CharacterName.fromString('Gandalf');
      expect(name1.equals(name2)).toBe(true);
    });

    it('should return false for different names', () => {
      const name1 = CharacterName.fromString('Gandalf');
      const name2 = CharacterName.fromString('Aragorn');
      expect(name1.equals(name2)).toBe(false);
    });

    it('should return false for null', () => {
      const name = CharacterName.fromString('Gandalf');
      expect(name.equals(null)).toBe(false);
    });
  });
});

describe('CharacterRace', () => {
  describe('fromString()', () => {
    it.each([
      'Human',
      'Elf',
      'Dwarf',
      'Halfling',
      'Orc',
      'Gnome',
      'Half-Elf',
      'Tiefling',
      'Dragonborn',
    ])('should accept valid race: %s', (race) => {
      const characterRace = CharacterRace.fromString(race);
      expect(characterRace.toString()).toBe(race);
    });

    it('should throw for invalid race', () => {
      expect(() => CharacterRace.fromString('Alien')).toThrow(
        InvalidCharacterRaceException,
      );
    });

    it('should be case-sensitive', () => {
      expect(() => CharacterRace.fromString('human')).toThrow(
        InvalidCharacterRaceException,
      );
    });
  });

  describe('equals()', () => {
    it('should return true for equal races', () => {
      const race1 = CharacterRace.fromString('Elf');
      const race2 = CharacterRace.fromString('Elf');
      expect(race1.equals(race2)).toBe(true);
    });

    it('should return false for different races', () => {
      const race1 = CharacterRace.fromString('Elf');
      const race2 = CharacterRace.fromString('Dwarf');
      expect(race1.equals(race2)).toBe(false);
    });
  });
});

describe('CharacterClass', () => {
  describe('fromString()', () => {
    it.each([
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
    ])('should accept valid class: %s', (cls) => {
      const characterClass = CharacterClass.fromString(cls);
      expect(characterClass.toString()).toBe(cls);
    });

    it('should throw for invalid class', () => {
      expect(() => CharacterClass.fromString('Necromancer')).toThrow(
        InvalidCharacterClassException,
      );
    });
  });

  describe('equals()', () => {
    it('should return true for equal classes', () => {
      const cls1 = CharacterClass.fromString('Mage');
      const cls2 = CharacterClass.fromString('Mage');
      expect(cls1.equals(cls2)).toBe(true);
    });

    it('should return false for different classes', () => {
      const cls1 = CharacterClass.fromString('Mage');
      const cls2 = CharacterClass.fromString('Rogue');
      expect(cls1.equals(cls2)).toBe(false);
    });
  });
});

describe('CharacterBackground', () => {
  describe('fromString()', () => {
    it('should create a valid background', () => {
      const bg = CharacterBackground.fromString('A wandering scholar');
      expect(bg.toString()).toBe('A wandering scholar');
    });

    it('should trim whitespace', () => {
      const bg = CharacterBackground.fromString('  A wandering scholar  ');
      expect(bg.toString()).toBe('A wandering scholar');
    });

    it('should throw for empty string', () => {
      expect(() => CharacterBackground.fromString('')).toThrow(
        InvalidCharacterBackgroundException,
      );
    });

    it('should throw for background exceeding 100 chars', () => {
      const longBg = 'a'.repeat(101);
      expect(() => CharacterBackground.fromString(longBg)).toThrow(
        InvalidCharacterBackgroundException,
      );
    });

    it('should accept background at exactly 100 chars', () => {
      const exactBg = 'a'.repeat(100);
      const bg = CharacterBackground.fromString(exactBg);
      expect(bg.toString()).toBe(exactBg);
    });
  });

  describe('equals()', () => {
    it('should return true for equal backgrounds', () => {
      const bg1 = CharacterBackground.fromString('Scholar');
      const bg2 = CharacterBackground.fromString('Scholar');
      expect(bg1.equals(bg2)).toBe(true);
    });

    it('should return false for different backgrounds', () => {
      const bg1 = CharacterBackground.fromString('Scholar');
      const bg2 = CharacterBackground.fromString('Warrior');
      expect(bg1.equals(bg2)).toBe(false);
    });
  });
});

describe('CharacterStats', () => {
  const validStats = {
    strength: 10,
    dexterity: 12,
    constitution: 14,
    intelligence: 16,
    wisdom: 8,
    charisma: 18,
  };

  describe('create()', () => {
    it('should create valid stats', () => {
      const stats = CharacterStats.create(validStats);
      expect(stats.toPrimitives()).toEqual(validStats);
    });

    it('should accept boundary values (1 and 20)', () => {
      const stats = CharacterStats.create({
        strength: 1,
        dexterity: 1,
        constitution: 1,
        intelligence: 1,
        wisdom: 1,
        charisma: 20,
      });
      const prims = stats.toPrimitives();
      expect(prims.strength).toBe(1);
      expect(prims.charisma).toBe(20);
    });

    it('should throw for stat below 1', () => {
      expect(() =>
        CharacterStats.create({ ...validStats, strength: 0 }),
      ).toThrow(InvalidCharacterStatsException);
    });

    it('should throw for stat above 20', () => {
      expect(() =>
        CharacterStats.create({ ...validStats, wisdom: 21 }),
      ).toThrow(InvalidCharacterStatsException);
    });

    it('should throw for non-integer stat', () => {
      expect(() =>
        CharacterStats.create({ ...validStats, dexterity: 10.5 }),
      ).toThrow(InvalidCharacterStatsException);
    });

    it('should include stat name in error message', () => {
      expect(() =>
        CharacterStats.create({ ...validStats, charisma: 25 }),
      ).toThrow('charisma');
    });
  });

  describe('fromPrimitives()', () => {
    it('should reconstruct from primitives', () => {
      const stats = CharacterStats.fromPrimitives(validStats);
      expect(stats.toPrimitives()).toEqual(validStats);
    });
  });

  describe('equals()', () => {
    it('should return true for equal stats', () => {
      const stats1 = CharacterStats.create(validStats);
      const stats2 = CharacterStats.create(validStats);
      expect(stats1.equals(stats2)).toBe(true);
    });

    it('should return false for different stats', () => {
      const stats1 = CharacterStats.create(validStats);
      const stats2 = CharacterStats.create({
        ...validStats,
        strength: 15,
      });
      expect(stats1.equals(stats2)).toBe(false);
    });

    it('should return false for null', () => {
      const stats = CharacterStats.create(validStats);
      expect(stats.equals(null)).toBe(false);
    });
  });
});

describe('CharacterStatus', () => {
  describe('factory methods', () => {
    it('should create pending status', () => {
      const status = CharacterStatus.pending();
      expect(status.isPending()).toBe(true);
      expect(status.isApproved()).toBe(false);
      expect(status.isRejected()).toBe(false);
      expect(status.toString()).toBe('pending');
    });

    it('should create approved status', () => {
      const status = CharacterStatus.approved();
      expect(status.isPending()).toBe(false);
      expect(status.isApproved()).toBe(true);
      expect(status.isRejected()).toBe(false);
      expect(status.toString()).toBe('approved');
    });

    it('should create rejected status', () => {
      const status = CharacterStatus.rejected();
      expect(status.isPending()).toBe(false);
      expect(status.isApproved()).toBe(false);
      expect(status.isRejected()).toBe(true);
      expect(status.toString()).toBe('rejected');
    });
  });

  describe('fromString()', () => {
    it('should parse valid status', () => {
      const status = CharacterStatus.fromString('pending');
      expect(status.isPending()).toBe(true);
    });

    it('should throw for invalid status', () => {
      expect(() => CharacterStatus.fromString('unknown')).toThrow(
        InvalidCharacterStatusException,
      );
    });
  });

  describe('equals()', () => {
    it('should return true for equal statuses', () => {
      const s1 = CharacterStatus.pending();
      const s2 = CharacterStatus.pending();
      expect(s1.equals(s2)).toBe(true);
    });

    it('should return false for different statuses', () => {
      const s1 = CharacterStatus.pending();
      const s2 = CharacterStatus.approved();
      expect(s1.equals(s2)).toBe(false);
    });
  });
});

describe('SpellList', () => {
  describe('create()', () => {
    it('should create a valid spell list', () => {
      const spells = SpellList.create(['Fireball', 'Ice Storm']);
      expect(spells.toArray()).toEqual(['Fireball', 'Ice Storm']);
    });

    it('should create empty spell list', () => {
      const spells = SpellList.create([]);
      expect(spells.toArray()).toEqual([]);
    });

    it('should throw for more than 20 spells', () => {
      const tooMany = Array.from({ length: 21 }, (_, i) => `Spell ${i}`);
      expect(() => SpellList.create(tooMany)).toThrow(
        InvalidSpellListException,
      );
    });

    it('should throw for spell name exceeding 50 chars', () => {
      expect(() => SpellList.create(['a'.repeat(51)])).toThrow(
        InvalidSpellListException,
      );
    });

    it('should throw for duplicate spells (case-insensitive)', () => {
      expect(() =>
        SpellList.create(['Fireball', 'fireball']),
      ).toThrow(InvalidSpellListException);
    });

    it('should accept spells at max count (20)', () => {
      const maxSpells = Array.from({ length: 20 }, (_, i) => `Spell ${i}`);
      const spells = SpellList.create(maxSpells);
      expect(spells.toArray()).toHaveLength(20);
    });
  });

  describe('empty()', () => {
    it('should create empty list', () => {
      const spells = SpellList.empty();
      expect(spells.toArray()).toEqual([]);
    });
  });

  describe('equals()', () => {
    it('should return true for equal spell lists', () => {
      const s1 = SpellList.create(['Fireball', 'Ice Storm']);
      const s2 = SpellList.create(['Fireball', 'Ice Storm']);
      expect(s1.equals(s2)).toBe(true);
    });

    it('should return false for different spell lists', () => {
      const s1 = SpellList.create(['Fireball']);
      const s2 = SpellList.create(['Ice Storm']);
      expect(s1.equals(s2)).toBe(false);
    });

    it('should return false for different lengths', () => {
      const s1 = SpellList.create(['Fireball']);
      const s2 = SpellList.create(['Fireball', 'Ice Storm']);
      expect(s1.equals(s2)).toBe(false);
    });
  });
});
