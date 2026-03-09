import { CharacterApproved } from '../events/character-approved.event.js';
import { CharacterRejected } from '../events/character-rejected.event.js';
import { CharacterModifiedByGM } from '../events/character-modified-by-gm.event.js';

describe('CharacterApproved', () => {
  it('should have correct type property', () => {
    const event = new CharacterApproved(
      'char-123',
      'gm-user-1',
      'Gandalf',
      '2026-03-08T12:00:00.000Z',
    );

    expect(event.type).toBe('CharacterApproved');
  });

  it('should set all properties correctly', () => {
    const event = new CharacterApproved(
      'char-123',
      'gm-user-1',
      'Gandalf',
      '2026-03-08T12:00:00.000Z',
    );

    expect(event.characterId).toBe('char-123');
    expect(event.approvedBy).toBe('gm-user-1');
    expect(event.characterName).toBe('Gandalf');
    expect(event.approvedAt).toBe('2026-03-08T12:00:00.000Z');
  });
});

describe('CharacterRejected', () => {
  it('should have correct type property', () => {
    const event = new CharacterRejected(
      'char-123',
      'gm-user-1',
      'Gandalf',
      'Need more detail',
      '2026-03-08T12:00:00.000Z',
    );

    expect(event.type).toBe('CharacterRejected');
  });

  it('should set all properties correctly', () => {
    const event = new CharacterRejected(
      'char-123',
      'gm-user-1',
      'Gandalf',
      'Need more detail',
      '2026-03-08T12:00:00.000Z',
    );

    expect(event.characterId).toBe('char-123');
    expect(event.rejectedBy).toBe('gm-user-1');
    expect(event.characterName).toBe('Gandalf');
    expect(event.reason).toBe('Need more detail');
    expect(event.rejectedAt).toBe('2026-03-08T12:00:00.000Z');
  });
});

describe('CharacterModifiedByGM', () => {
  const modifications = { name: 'Gandalf the White', stats: { strength: 18, dexterity: 14, constitution: 16, intelligence: 20, wisdom: 18, charisma: 16 } };
  const previousValues = { name: 'Gandalf', stats: { strength: 16, dexterity: 14, constitution: 14, intelligence: 18, wisdom: 16, charisma: 14 } };
  const modifiedFields = ['name', 'stats'];

  it('should have correct type property', () => {
    const event = new CharacterModifiedByGM(
      'char-123',
      'campaign-1',
      'gm-user-1',
      'Gandalf',
      modifications,
      previousValues,
      modifiedFields,
      '2026-03-08T12:00:00.000Z',
    );

    expect(event.type).toBe('CharacterModifiedByGM');
  });

  it('should set all properties correctly', () => {
    const event = new CharacterModifiedByGM(
      'char-123',
      'campaign-1',
      'gm-user-1',
      'Gandalf',
      modifications,
      previousValues,
      modifiedFields,
      '2026-03-08T12:00:00.000Z',
    );

    expect(event.characterId).toBe('char-123');
    expect(event.campaignId).toBe('campaign-1');
    expect(event.modifiedBy).toBe('gm-user-1');
    expect(event.characterName).toBe('Gandalf');
    expect(event.modifications).toEqual(modifications);
    expect(event.previousValues).toEqual(previousValues);
    expect(event.modifiedFields).toEqual(modifiedFields);
    expect(event.modifiedAt).toBe('2026-03-08T12:00:00.000Z');
  });

  it('should handle partial modifications (single field)', () => {
    const singleMod = { name: 'Gandalf the White' };
    const singlePrev = { name: 'Gandalf' };

    const event = new CharacterModifiedByGM(
      'char-123',
      'campaign-1',
      'gm-user-1',
      'Gandalf',
      singleMod,
      singlePrev,
      ['name'],
      '2026-03-08T12:00:00.000Z',
    );

    expect(event.modifications).toEqual(singleMod);
    expect(event.previousValues).toEqual(singlePrev);
    expect(event.modifiedFields).toEqual(['name']);
  });

  it('should preserve event data through JSON serialization round-trip', () => {
    const event = new CharacterModifiedByGM(
      'char-123',
      'campaign-1',
      'gm-user-1',
      'Gandalf',
      modifications,
      previousValues,
      modifiedFields,
      '2026-03-08T12:00:00.000Z',
    );

    const serialized = JSON.parse(JSON.stringify(event));

    expect(serialized.type).toBe('CharacterModifiedByGM');
    expect(serialized.characterId).toBe('char-123');
    expect(serialized.campaignId).toBe('campaign-1');
    expect(serialized.modifiedBy).toBe('gm-user-1');
    expect(serialized.characterName).toBe('Gandalf');
    expect(serialized.modifications).toEqual(modifications);
    expect(serialized.previousValues).toEqual(previousValues);
    expect(serialized.modifiedFields).toEqual(modifiedFields);
    expect(serialized.modifiedAt).toBe('2026-03-08T12:00:00.000Z');
  });

  it('should handle all six fields modified at once', () => {
    const allMods = {
      name: 'Gandalf the White',
      race: 'Elf',
      characterClass: 'Mage',
      background: 'Istari reborn',
      stats: { strength: 20, dexterity: 16, constitution: 18, intelligence: 20, wisdom: 20, charisma: 18 },
      spells: ['Lightning Bolt', 'Shield', 'Teleport'],
    };
    const allPrev = {
      name: 'Gandalf',
      race: 'Human',
      characterClass: 'Warrior',
      background: 'Wanderer',
      stats: { strength: 16, dexterity: 14, constitution: 14, intelligence: 18, wisdom: 16, charisma: 14 },
      spells: ['Fireball'],
    };
    const allFields = ['name', 'race', 'characterClass', 'background', 'stats', 'spells'];

    const event = new CharacterModifiedByGM(
      'char-123',
      'campaign-1',
      'gm-user-1',
      'Gandalf',
      allMods,
      allPrev,
      allFields,
      '2026-03-08T12:00:00.000Z',
    );

    expect(event.modifications).toEqual(allMods);
    expect(event.previousValues).toEqual(allPrev);
    expect(event.modifiedFields).toHaveLength(6);
  });

  it('should handle empty spells array in modifications', () => {
    const event = new CharacterModifiedByGM(
      'char-123',
      'campaign-1',
      'gm-user-1',
      'Gandalf',
      { spells: [] },
      { spells: ['Fireball'] },
      ['spells'],
      '2026-03-08T12:00:00.000Z',
    );

    expect(event.modifications.spells).toEqual([]);
    expect(event.previousValues.spells).toEqual(['Fireball']);
  });
});
