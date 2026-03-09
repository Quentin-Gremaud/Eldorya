import { Character } from '../character.aggregate.js';
import { CharacterCreated } from '../events/character-created.event.js';
import { CharacterApproved } from '../events/character-approved.event.js';
import { CharacterRejected } from '../events/character-rejected.event.js';
import { CharacterModifiedByGM } from '../events/character-modified-by-gm.event.js';
import { CharacterAlreadyExistsException } from '../exceptions/character-already-exists.exception.js';
import { CharacterNotPendingException } from '../exceptions/character-not-pending.exception.js';
import { CharacterNotApprovedException } from '../exceptions/character-not-approved.exception.js';
import { CharacterModification } from '../character-modification.js';
import { CharacterExistenceChecker } from '../character-existence-checker.port.js';
import { UserId } from '../../../shared/user-id.js';
import { RejectionReason } from '../rejection-reason.js';
import type { Clock } from '../../../shared/clock.js';

describe('Character', () => {
  const characterId = 'char-123';
  const userId = 'user-player-1';
  const campaignId = 'campaign-456';
  const createClock: Clock = {
    now: jest.fn().mockReturnValue(new Date('2026-03-01T12:00:00.000Z')),
  };

  const validParams = {
    id: characterId,
    userId,
    campaignId,
    name: 'Gandalf',
    race: 'Human',
    characterClass: 'Mage',
    background: 'A wandering wizard',
    stats: {
      strength: 8,
      dexterity: 14,
      constitution: 12,
      intelligence: 18,
      wisdom: 16,
      charisma: 10,
    },
    spells: ['Fireball', 'Shield'],
  };

  const mockExistenceChecker: CharacterExistenceChecker = {
    exists: jest.fn().mockResolvedValue(false),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (mockExistenceChecker.exists as jest.Mock).mockResolvedValue(false);
  });

  describe('create()', () => {
    it('should emit CharacterCreated with correct data', async () => {
      const character = await Character.create(
        validParams,
        mockExistenceChecker,
        createClock,
      );

      const events = character.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(CharacterCreated);

      const event = events[0] as CharacterCreated;
      expect(event.characterId).toBe(characterId);
      expect(event.userId).toBe(userId);
      expect(event.campaignId).toBe(campaignId);
      expect(event.name).toBe('Gandalf');
      expect(event.race).toBe('Human');
      expect(event.characterClass).toBe('Mage');
      expect(event.background).toBe('A wandering wizard');
      expect(event.stats).toEqual(validParams.stats);
      expect(event.spells).toEqual(['Fireball', 'Shield']);
      expect(event.status).toBe('pending');
    });

    it('should set aggregate state correctly', async () => {
      const character = await Character.create(
        validParams,
        mockExistenceChecker,
        createClock,
      );

      expect(character.getId()).toBe(characterId);
      expect(character.getUserId()).toBe(userId);
      expect(character.getCampaignId()).toBe(campaignId);
      expect(character.getStatus().isPending()).toBe(true);
    });

    it('should throw CharacterAlreadyExistsException if character exists', async () => {
      (mockExistenceChecker.exists as jest.Mock).mockResolvedValue(true);

      await expect(
        Character.create(validParams, mockExistenceChecker, createClock),
      ).rejects.toThrow(CharacterAlreadyExistsException);
    });

    it('should throw with correct message for duplicate', async () => {
      (mockExistenceChecker.exists as jest.Mock).mockResolvedValue(true);

      await expect(
        Character.create(validParams, mockExistenceChecker, createClock),
      ).rejects.toThrow(
        'A character already exists for this player in this campaign.',
      );
    });

    it('should call existenceChecker with correct params', async () => {
      await Character.create(validParams, mockExistenceChecker, createClock);

      expect(mockExistenceChecker.exists).toHaveBeenCalledWith(
        campaignId,
        userId,
      );
    });

    it('should validate name via VO (rejects empty)', async () => {
      await expect(
        Character.create(
          { ...validParams, name: '' },
          mockExistenceChecker,
          createClock,
        ),
      ).rejects.toThrow();
    });

    it('should validate race via VO (rejects invalid)', async () => {
      await expect(
        Character.create(
          { ...validParams, race: 'Alien' },
          mockExistenceChecker,
          createClock,
        ),
      ).rejects.toThrow();
    });

    it('should validate class via VO (rejects invalid)', async () => {
      await expect(
        Character.create(
          { ...validParams, characterClass: 'Necromancer' },
          mockExistenceChecker,
          createClock,
        ),
      ).rejects.toThrow();
    });

    it('should validate stats via VO (rejects out of range)', async () => {
      await expect(
        Character.create(
          {
            ...validParams,
            stats: { ...validParams.stats, strength: 25 },
          },
          mockExistenceChecker,
          createClock,
        ),
      ).rejects.toThrow();
    });

    it('should create character with empty spells', async () => {
      const character = await Character.create(
        { ...validParams, spells: [] },
        mockExistenceChecker,
        createClock,
      );

      const event = character.getUncommittedEvents()[0] as CharacterCreated;
      expect(event.spells).toEqual([]);
    });
  });

  describe('loadFromHistory()', () => {
    it('should correctly reconstruct from CharacterCreated event', () => {
      const character = Character.loadFromHistory([
        {
          type: 'CharacterCreated',
          data: {
            characterId,
            userId,
            campaignId,
            name: 'Gandalf',
            race: 'Human',
            characterClass: 'Mage',
            background: 'A wandering wizard',
            stats: validParams.stats,
            spells: ['Fireball', 'Shield'],
            status: 'pending',
            createdAt: '2026-03-01T12:00:00.000Z',
          },
        },
      ]);

      expect(character.getId()).toBe(characterId);
      expect(character.getUserId()).toBe(userId);
      expect(character.getCampaignId()).toBe(campaignId);
      expect(character.getStatus().isPending()).toBe(true);
      expect(character.getUncommittedEvents()).toHaveLength(0);
    });

    it('should throw on unknown event type', () => {
      expect(() =>
        Character.loadFromHistory([
          { type: 'SomeUnknownEvent', data: { foo: 'bar' } },
        ]),
      ).toThrow('Unknown event type: SomeUnknownEvent');
    });

    it('should throw when required field is not a string', () => {
      expect(() =>
        Character.loadFromHistory([
          {
            type: 'CharacterCreated',
            data: {
              characterId: 123,
              userId,
              campaignId,
              name: 'Gandalf',
              race: 'Human',
              characterClass: 'Mage',
              background: 'test',
              stats: validParams.stats,
              spells: [],
              status: 'pending',
              createdAt: '2026-03-01T12:00:00.000Z',
            },
          },
        ]),
      ).toThrow(
        'Invalid event data: "characterId" must be a string in CharacterCreated, got number',
      );
    });
  });

  describe('clearEvents()', () => {
    it('should clear uncommitted events', async () => {
      const character = await Character.create(
        validParams,
        mockExistenceChecker,
        createClock,
      );

      expect(character.getUncommittedEvents()).toHaveLength(1);
      character.clearEvents();
      expect(character.getUncommittedEvents()).toHaveLength(0);
    });
  });

  describe('approve()', () => {
    const mockClock: Clock = {
      now: jest.fn().mockReturnValue(new Date('2026-03-08T12:00:00.000Z')),
    };

    const createPendingCharacter = async () => {
      const character = await Character.create(
        validParams,
        mockExistenceChecker,
        createClock,
      );
      character.clearEvents();
      return character;
    };

    it('should approve pending character and emit CharacterApproved event', async () => {
      const character = await createPendingCharacter();
      const approvedBy = UserId.fromString('gm-user-1');

      character.approve(approvedBy, mockClock);

      expect(character.getStatus().isApproved()).toBe(true);
      const events = character.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(CharacterApproved);
    });

    it('should emit event with correct data', async () => {
      const character = await createPendingCharacter();
      const approvedBy = UserId.fromString('gm-user-1');

      character.approve(approvedBy, mockClock);

      const event = character.getUncommittedEvents()[0] as CharacterApproved;
      expect(event.characterId).toBe(characterId);
      expect(event.approvedBy).toBe('gm-user-1');
      expect(event.characterName).toBe('Gandalf');
      expect(event.approvedAt).toBe('2026-03-08T12:00:00.000Z');
    });

    it('should throw CharacterNotPendingException when not pending', async () => {
      const character = await createPendingCharacter();
      const approvedBy = UserId.fromString('gm-user-1');

      character.approve(approvedBy, mockClock);

      expect(() => character.approve(approvedBy, mockClock)).toThrow(
        CharacterNotPendingException,
      );
    });
  });

  describe('reject()', () => {
    const mockClock: Clock = {
      now: jest.fn().mockReturnValue(new Date('2026-03-08T12:00:00.000Z')),
    };

    const createPendingCharacter = async () => {
      const character = await Character.create(
        validParams,
        mockExistenceChecker,
        createClock,
      );
      character.clearEvents();
      return character;
    };

    it('should reject pending character and emit CharacterRejected event', async () => {
      const character = await createPendingCharacter();
      const rejectedBy = UserId.fromString('gm-user-1');
      const reason = RejectionReason.fromString('Need more detail');

      character.reject(rejectedBy, reason, mockClock);

      expect(character.getStatus().isRejected()).toBe(true);
      const events = character.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(CharacterRejected);
    });

    it('should emit event with correct data', async () => {
      const character = await createPendingCharacter();
      const rejectedBy = UserId.fromString('gm-user-1');
      const reason = RejectionReason.fromString('Need more detail');

      character.reject(rejectedBy, reason, mockClock);

      const event = character.getUncommittedEvents()[0] as CharacterRejected;
      expect(event.characterId).toBe(characterId);
      expect(event.rejectedBy).toBe('gm-user-1');
      expect(event.characterName).toBe('Gandalf');
      expect(event.reason).toBe('Need more detail');
      expect(event.rejectedAt).toBe('2026-03-08T12:00:00.000Z');
    });

    it('should throw CharacterNotPendingException when not pending', async () => {
      const character = await createPendingCharacter();
      const rejectedBy = UserId.fromString('gm-user-1');
      const reason = RejectionReason.fromString('Need more detail');

      character.reject(rejectedBy, reason, mockClock);

      expect(() => character.reject(rejectedBy, reason, mockClock)).toThrow(
        CharacterNotPendingException,
      );
    });
  });

  describe('loadFromHistory() with approve/reject', () => {
    const createdEvent = {
      type: 'CharacterCreated',
      data: {
        characterId,
        userId,
        campaignId,
        name: 'Gandalf',
        race: 'Human',
        characterClass: 'Mage',
        background: 'A wandering wizard',
        stats: validParams.stats,
        spells: ['Fireball', 'Shield'],
        status: 'pending',
        createdAt: '2026-03-01T12:00:00.000Z',
      },
    };

    it('should reconstruct approved character from history', () => {
      const character = Character.loadFromHistory([
        createdEvent,
        {
          type: 'CharacterApproved',
          data: {
            characterId,
            approvedBy: 'gm-user-1',
            characterName: 'Gandalf',
            approvedAt: '2026-03-08T12:00:00.000Z',
          },
        },
      ]);

      expect(character.getStatus().isApproved()).toBe(true);
      expect(character.getUncommittedEvents()).toHaveLength(0);
    });

    it('should reconstruct rejected character from history', () => {
      const character = Character.loadFromHistory([
        createdEvent,
        {
          type: 'CharacterRejected',
          data: {
            characterId,
            rejectedBy: 'gm-user-1',
            characterName: 'Gandalf',
            reason: 'Need more detail',
            rejectedAt: '2026-03-08T12:00:00.000Z',
          },
        },
      ]);

      expect(character.getStatus().isRejected()).toBe(true);
      expect(character.getUncommittedEvents()).toHaveLength(0);
    });

    it('should handle resubmission: Created → Rejected → Created again → pending', () => {
      const character = Character.loadFromHistory([
        createdEvent,
        {
          type: 'CharacterRejected',
          data: {
            characterId,
            rejectedBy: 'gm-user-1',
            characterName: 'Gandalf',
            reason: 'Need more detail',
            rejectedAt: '2026-03-02T12:00:00.000Z',
          },
        },
        {
          type: 'CharacterCreated',
          data: {
            characterId,
            userId,
            campaignId,
            name: 'Gandalf the Grey',
            race: 'Human',
            characterClass: 'Mage',
            background: 'An improved background',
            stats: validParams.stats,
            spells: ['Fireball', 'Shield'],
            status: 'pending',
            createdAt: '2026-03-03T12:00:00.000Z',
          },
        },
      ]);

      expect(character.getStatus().isPending()).toBe(true);
      expect(character.getName()).toBe('Gandalf the Grey');
      expect(character.getUncommittedEvents()).toHaveLength(0);
    });
  });

  describe('rejectionReason', () => {
    const mockClock: Clock = {
      now: jest.fn().mockReturnValue(new Date('2026-03-08T12:00:00.000Z')),
    };

    const createPendingCharacter = async () => {
      const character = await Character.create(
        validParams,
        mockExistenceChecker,
        createClock,
      );
      character.clearEvents();
      return character;
    };

    it('should be null after creation', async () => {
      const character = await Character.create(
        validParams,
        mockExistenceChecker,
        createClock,
      );

      expect(character.getRejectionReason()).toBeNull();
    });

    it('should store rejection reason after rejection', async () => {
      const character = await createPendingCharacter();
      const rejectedBy = UserId.fromString('gm-user-1');
      const reason = RejectionReason.fromString('Need more detail');

      character.reject(rejectedBy, reason, mockClock);

      expect(character.getRejectionReason()).toBe('Need more detail');
    });

    it('should clear rejection reason after approval', async () => {
      const character = Character.loadFromHistory([
        {
          type: 'CharacterCreated',
          data: {
            characterId,
            userId,
            campaignId,
            name: 'Gandalf',
            race: 'Human',
            characterClass: 'Mage',
            background: 'A wandering wizard',
            stats: validParams.stats,
            spells: ['Fireball', 'Shield'],
            status: 'pending',
            createdAt: '2026-03-01T12:00:00.000Z',
          },
        },
        {
          type: 'CharacterRejected',
          data: {
            characterId,
            rejectedBy: 'gm-user-1',
            characterName: 'Gandalf',
            reason: 'Need more detail',
            rejectedAt: '2026-03-02T12:00:00.000Z',
          },
        },
        {
          type: 'CharacterCreated',
          data: {
            characterId,
            userId,
            campaignId,
            name: 'Gandalf the Grey',
            race: 'Human',
            characterClass: 'Mage',
            background: 'An improved background',
            stats: validParams.stats,
            spells: ['Fireball', 'Shield'],
            status: 'pending',
            createdAt: '2026-03-03T12:00:00.000Z',
          },
        },
      ]);

      expect(character.getRejectionReason()).toBeNull();
    });

    it('should store rejection reason from history', () => {
      const character = Character.loadFromHistory([
        {
          type: 'CharacterCreated',
          data: {
            characterId,
            userId,
            campaignId,
            name: 'Gandalf',
            race: 'Human',
            characterClass: 'Mage',
            background: 'A wandering wizard',
            stats: validParams.stats,
            spells: ['Fireball', 'Shield'],
            status: 'pending',
            createdAt: '2026-03-01T12:00:00.000Z',
          },
        },
        {
          type: 'CharacterRejected',
          data: {
            characterId,
            rejectedBy: 'gm-user-1',
            characterName: 'Gandalf',
            reason: 'Need more detail',
            rejectedAt: '2026-03-02T12:00:00.000Z',
          },
        },
      ]);

      expect(character.getRejectionReason()).toBe('Need more detail');
    });

    it('should clear rejection reason when approved after loadFromHistory', () => {
      const character = Character.loadFromHistory([
        {
          type: 'CharacterCreated',
          data: {
            characterId,
            userId,
            campaignId,
            name: 'Gandalf',
            race: 'Human',
            characterClass: 'Mage',
            background: 'A wandering wizard',
            stats: validParams.stats,
            spells: ['Fireball', 'Shield'],
            status: 'pending',
            createdAt: '2026-03-01T12:00:00.000Z',
          },
        },
        {
          type: 'CharacterApproved',
          data: {
            characterId,
            approvedBy: 'gm-user-1',
            characterName: 'Gandalf',
            approvedAt: '2026-03-08T12:00:00.000Z',
          },
        },
      ]);

      expect(character.getRejectionReason()).toBeNull();
    });
  });

  describe('modifyByGm()', () => {
    const mockClock: Clock = {
      now: jest.fn().mockReturnValue(new Date('2026-03-08T14:00:00.000Z')),
    };

    const createdEvent = {
      type: 'CharacterCreated',
      data: {
        characterId,
        userId,
        campaignId,
        name: 'Gandalf',
        race: 'Human',
        characterClass: 'Mage',
        background: 'A wandering wizard',
        stats: validParams.stats,
        spells: ['Fireball', 'Shield'],
        status: 'pending',
        createdAt: '2026-03-01T12:00:00.000Z',
      },
    };

    const approvedEvent = {
      type: 'CharacterApproved',
      data: {
        characterId,
        approvedBy: 'gm-user-1',
        characterName: 'Gandalf',
        approvedAt: '2026-03-08T12:00:00.000Z',
      },
    };

    const createApprovedCharacter = () => {
      return Character.loadFromHistory([createdEvent, approvedEvent]);
    };

    it('should emit CharacterModifiedByGM event with correct previous and new values', () => {
      const character = createApprovedCharacter();
      const modifiedBy = UserId.fromString('gm-user-1');
      const modifications = CharacterModification.create({
        name: 'Gandalf the White',
        stats: { strength: 10, dexterity: 16, constitution: 14, intelligence: 20, wisdom: 18, charisma: 12 },
      });

      character.modifyByGm(modifiedBy, modifications, mockClock);

      const events = character.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(CharacterModifiedByGM);

      const event = events[0] as CharacterModifiedByGM;
      expect(event.characterId).toBe(characterId);
      expect(event.campaignId).toBe(campaignId);
      expect(event.modifiedBy).toBe('gm-user-1');
      expect(event.characterName).toBe('Gandalf');
      expect(event.modifications).toEqual({
        name: 'Gandalf the White',
        stats: { strength: 10, dexterity: 16, constitution: 14, intelligence: 20, wisdom: 18, charisma: 12 },
      });
      expect(event.previousValues).toEqual({
        name: 'Gandalf',
        stats: validParams.stats,
      });
      expect(event.modifiedFields).toEqual(['name', 'stats']);
      expect(event.modifiedAt).toBe('2026-03-08T14:00:00.000Z');
    });

    it('should update aggregate state after modification', () => {
      const character = createApprovedCharacter();
      const modifiedBy = UserId.fromString('gm-user-1');
      const modifications = CharacterModification.create({
        name: 'Gandalf the White',
        race: 'Elf',
      });

      character.modifyByGm(modifiedBy, modifications, mockClock);

      expect(character.getName()).toBe('Gandalf the White');
      expect(character.getRace()).toBe('Elf');
      expect(character.getCharacterClass()).toBe('Mage');
      expect(character.getStatus().isApproved()).toBe(true);
    });

    it('should throw CharacterNotApprovedException when character is pending', async () => {
      const character = await Character.create(
        validParams,
        mockExistenceChecker,
        createClock,
      );
      character.clearEvents();
      const modifiedBy = UserId.fromString('gm-user-1');
      const modifications = CharacterModification.create({ name: 'New Name' });

      expect(() => character.modifyByGm(modifiedBy, modifications, mockClock)).toThrow(
        CharacterNotApprovedException,
      );
    });

    it('should throw CharacterNotApprovedException when character is rejected', () => {
      const character = Character.loadFromHistory([
        createdEvent,
        {
          type: 'CharacterRejected',
          data: {
            characterId,
            rejectedBy: 'gm-user-1',
            characterName: 'Gandalf',
            reason: 'Bad background',
            rejectedAt: '2026-03-08T12:00:00.000Z',
          },
        },
      ]);
      const modifiedBy = UserId.fromString('gm-user-1');
      const modifications = CharacterModification.create({ name: 'New Name' });

      expect(() => character.modifyByGm(modifiedBy, modifications, mockClock)).toThrow(
        CharacterNotApprovedException,
      );
    });

    it('should handle multiple sequential modifications', () => {
      const character = createApprovedCharacter();
      const modifiedBy = UserId.fromString('gm-user-1');

      const firstMod = CharacterModification.create({ name: 'Gandalf the White' });
      character.modifyByGm(modifiedBy, firstMod, mockClock);

      const secondMod = CharacterModification.create({ name: 'Gandalf the Grey' });
      character.modifyByGm(modifiedBy, secondMod, mockClock);

      expect(character.getName()).toBe('Gandalf the Grey');
      const events = character.getUncommittedEvents();
      expect(events).toHaveLength(2);

      const secondEvent = events[1] as CharacterModifiedByGM;
      expect(secondEvent.previousValues.name).toBe('Gandalf the White');
      expect(secondEvent.modifications.name).toBe('Gandalf the Grey');
    });

    it('should handle partial modifications (only some fields changed)', () => {
      const character = createApprovedCharacter();
      const modifiedBy = UserId.fromString('gm-user-1');
      const modifications = CharacterModification.create({ background: 'A powerful wizard' });

      character.modifyByGm(modifiedBy, modifications, mockClock);

      const event = character.getUncommittedEvents()[0] as CharacterModifiedByGM;
      expect(event.modifications).toEqual({ background: 'A powerful wizard' });
      expect(event.previousValues).toEqual({ background: 'A wandering wizard' });
      expect(event.modifiedFields).toEqual(['background']);
      expect(character.getBackground()).toBe('A powerful wizard');
      expect(character.getName()).toBe('Gandalf');
    });

    it('should handle spells modification', () => {
      const character = createApprovedCharacter();
      const modifiedBy = UserId.fromString('gm-user-1');
      const modifications = CharacterModification.create({ spells: ['Fireball', 'Shield', 'Lightning Bolt'] });

      character.modifyByGm(modifiedBy, modifications, mockClock);

      expect(character.getSpells()).toEqual(['Fireball', 'Shield', 'Lightning Bolt']);
      const event = character.getUncommittedEvents()[0] as CharacterModifiedByGM;
      expect(event.previousValues.spells).toEqual(['Fireball', 'Shield']);
      expect(event.modifications.spells).toEqual(['Fireball', 'Shield', 'Lightning Bolt']);
    });
  });

  describe('loadFromHistory() with CharacterModifiedByGM', () => {
    const createdEvent = {
      type: 'CharacterCreated',
      data: {
        characterId,
        userId,
        campaignId,
        name: 'Gandalf',
        race: 'Human',
        characterClass: 'Mage',
        background: 'A wandering wizard',
        stats: validParams.stats,
        spells: ['Fireball', 'Shield'],
        status: 'pending',
        createdAt: '2026-03-01T12:00:00.000Z',
      },
    };

    const approvedEvent = {
      type: 'CharacterApproved',
      data: {
        characterId,
        approvedBy: 'gm-user-1',
        characterName: 'Gandalf',
        approvedAt: '2026-03-08T12:00:00.000Z',
      },
    };

    it('should reconstruct character with modification from history', () => {
      const character = Character.loadFromHistory([
        createdEvent,
        approvedEvent,
        {
          type: 'CharacterModifiedByGM',
          data: {
            characterId,
            campaignId,
            modifiedBy: 'gm-user-1',
            characterName: 'Gandalf',
            modifications: { name: 'Gandalf the White', race: 'Elf' },
            previousValues: { name: 'Gandalf', race: 'Human' },
            modifiedFields: ['name', 'race'],
            modifiedAt: '2026-03-08T14:00:00.000Z',
          },
        },
      ]);

      expect(character.getName()).toBe('Gandalf the White');
      expect(character.getRace()).toBe('Elf');
      expect(character.getCharacterClass()).toBe('Mage');
      expect(character.getStatus().isApproved()).toBe(true);
      expect(character.getUncommittedEvents()).toHaveLength(0);
    });

    it('should reconstruct character with multiple modifications from history', () => {
      const character = Character.loadFromHistory([
        createdEvent,
        approvedEvent,
        {
          type: 'CharacterModifiedByGM',
          data: {
            characterId,
            campaignId,
            modifiedBy: 'gm-user-1',
            characterName: 'Gandalf',
            modifications: { name: 'Gandalf the White' },
            previousValues: { name: 'Gandalf' },
            modifiedFields: ['name'],
            modifiedAt: '2026-03-08T14:00:00.000Z',
          },
        },
        {
          type: 'CharacterModifiedByGM',
          data: {
            characterId,
            campaignId,
            modifiedBy: 'gm-user-1',
            characterName: 'Gandalf the White',
            modifications: { characterClass: 'Cleric' },
            previousValues: { characterClass: 'Mage' },
            modifiedFields: ['characterClass'],
            modifiedAt: '2026-03-08T15:00:00.000Z',
          },
        },
      ]);

      expect(character.getName()).toBe('Gandalf the White');
      expect(character.getCharacterClass()).toBe('Cleric');
      expect(character.getUncommittedEvents()).toHaveLength(0);
    });
  });
});
