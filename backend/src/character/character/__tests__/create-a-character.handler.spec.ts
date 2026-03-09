import { CreateACharacterHandler } from '../commands/create-a-character.handler.js';
import { CreateACharacterCommand } from '../commands/create-a-character.command.js';
import { CharacterRepository } from '../character.repository.js';
import { CharacterExistenceChecker } from '../character-existence-checker.port.js';
import { CharacterAlreadyExistsException } from '../exceptions/character-already-exists.exception.js';
import type { Clock } from '../../../shared/clock.js';

describe('CreateACharacterHandler', () => {
  let handler: CreateACharacterHandler;
  let mockRepository: { saveNew: ReturnType<typeof jest.fn> };
  let mockExistenceChecker: CharacterExistenceChecker;
  let mockClock: Clock;

  const characterId = 'char-123';
  const userId = 'user-player-1';
  const campaignId = 'campaign-456';

  beforeEach(() => {
    mockClock = {
      now: jest.fn().mockReturnValue(new Date('2026-03-01T12:00:00.000Z')),
    };

    mockRepository = {
      saveNew: jest.fn().mockResolvedValue(undefined),
    };

    mockExistenceChecker = {
      exists: jest.fn().mockResolvedValue(false),
    };

    handler = new CreateACharacterHandler(
      mockRepository as unknown as CharacterRepository,
      mockExistenceChecker,
      mockClock,
    );
  });

  it('should delegate to CharacterRepository.saveNew', async () => {
    const command = new CreateACharacterCommand(
      characterId,
      userId,
      campaignId,
      'Gandalf',
      'Human',
      'Mage',
      'A wandering wizard',
      {
        strength: 8,
        dexterity: 14,
        constitution: 12,
        intelligence: 18,
        wisdom: 16,
        charisma: 10,
      },
      ['Fireball', 'Shield'],
    );

    await handler.execute(command);

    expect(mockRepository.saveNew).toHaveBeenCalledTimes(1);

    const [aggregate] = mockRepository.saveNew.mock.calls[0];
    expect(aggregate.getId()).toBe(characterId);
    expect(aggregate.getUserId()).toBe(userId);
    expect(aggregate.getCampaignId()).toBe(campaignId);
  });

  it('should pass raw command fields to aggregate (no VO construction in handler)', async () => {
    const command = new CreateACharacterCommand(
      characterId,
      userId,
      campaignId,
      'Gandalf',
      'Human',
      'Mage',
      'A wandering wizard',
      {
        strength: 8,
        dexterity: 14,
        constitution: 12,
        intelligence: 18,
        wisdom: 16,
        charisma: 10,
      },
      ['Fireball', 'Shield'],
    );

    await handler.execute(command);

    const [aggregate] = mockRepository.saveNew.mock.calls[0];
    const events = aggregate.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0].name).toBe('Gandalf');
    expect(events[0].race).toBe('Human');
    expect(events[0].characterClass).toBe('Mage');
    expect(events[0].background).toBe('A wandering wizard');
    expect(events[0].status).toBe('pending');
  });

  it('should propagate CharacterAlreadyExistsException from aggregate', async () => {
    (mockExistenceChecker.exists as jest.Mock).mockResolvedValue(true);

    const command = new CreateACharacterCommand(
      characterId,
      userId,
      campaignId,
      'Gandalf',
      'Human',
      'Mage',
      'A wandering wizard',
      {
        strength: 8,
        dexterity: 14,
        constitution: 12,
        intelligence: 18,
        wisdom: 16,
        charisma: 10,
      },
      ['Fireball', 'Shield'],
    );

    await expect(handler.execute(command)).rejects.toThrow(
      CharacterAlreadyExistsException,
    );

    expect(mockRepository.saveNew).not.toHaveBeenCalled();
  });

  it('should auto-approve character when creator is the GM', async () => {
    const command = new CreateACharacterCommand(
      characterId,
      userId,
      campaignId,
      'Gandalf',
      'Human',
      'Mage',
      'A wandering wizard',
      {
        strength: 8,
        dexterity: 14,
        constitution: 12,
        intelligence: 18,
        wisdom: 16,
        charisma: 10,
      },
      ['Fireball', 'Shield'],
      true, // isGm
    );

    await handler.execute(command);

    const [aggregate] = mockRepository.saveNew.mock.calls[0];
    const events = aggregate.getUncommittedEvents();
    expect(events).toHaveLength(2);
    expect(events[0].constructor.name).toBe('CharacterCreated');
    expect(events[1].constructor.name).toBe('CharacterApproved');
  });

  it('should NOT auto-approve character for regular players', async () => {
    const command = new CreateACharacterCommand(
      characterId,
      userId,
      campaignId,
      'Gandalf',
      'Human',
      'Mage',
      'A wandering wizard',
      {
        strength: 8,
        dexterity: 14,
        constitution: 12,
        intelligence: 18,
        wisdom: 16,
        charisma: 10,
      },
      ['Fireball', 'Shield'],
      false, // not GM
    );

    await handler.execute(command);

    const [aggregate] = mockRepository.saveNew.mock.calls[0];
    const events = aggregate.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0].constructor.name).toBe('CharacterCreated');
  });

  it('should handle empty spells list', async () => {
    const command = new CreateACharacterCommand(
      characterId,
      userId,
      campaignId,
      'Legolas',
      'Elf',
      'Rogue',
      'A forest ranger',
      {
        strength: 12,
        dexterity: 18,
        constitution: 10,
        intelligence: 14,
        wisdom: 16,
        charisma: 8,
      },
      [],
    );

    await handler.execute(command);

    const [aggregate] = mockRepository.saveNew.mock.calls[0];
    const events = aggregate.getUncommittedEvents();
    expect(events[0].spells).toEqual([]);
  });
});
