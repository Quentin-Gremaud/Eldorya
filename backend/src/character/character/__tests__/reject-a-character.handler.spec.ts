import { RejectACharacterHandler } from '../commands/reject-a-character.handler.js';
import { RejectACharacterCommand } from '../commands/reject-a-character.command.js';
import { CharacterRepository } from '../character.repository.js';
import { Character } from '../character.aggregate.js';
import { CharacterNotPendingException } from '../exceptions/character-not-pending.exception.js';
import type { Clock } from '../../../shared/clock.js';

describe('RejectACharacterHandler', () => {
  let handler: RejectACharacterHandler;
  let mockRepository: { load: jest.Mock; save: jest.Mock };
  let mockClock: Clock;

  const characterId = 'char-123';
  const userId = 'user-player-1';
  const campaignId = 'campaign-456';
  const gmUserId = 'gm-user-1';

  const pendingCharacterEvents = [
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
        stats: {
          strength: 8,
          dexterity: 14,
          constitution: 12,
          intelligence: 18,
          wisdom: 16,
          charisma: 10,
        },
        spells: ['Fireball', 'Shield'],
        status: 'pending',
        createdAt: '2026-03-01T12:00:00.000Z',
      },
    },
  ];

  beforeEach(() => {
    mockClock = {
      now: jest.fn().mockReturnValue(new Date('2026-03-08T12:00:00.000Z')),
    };

    mockRepository = {
      load: jest
        .fn()
        .mockResolvedValue(Character.loadFromHistory(pendingCharacterEvents)),
      save: jest.fn().mockResolvedValue(undefined),
    };

    handler = new RejectACharacterHandler(
      mockRepository as unknown as CharacterRepository,
      mockClock,
    );
  });

  it('should call repository.load then repository.save', async () => {
    const command = new RejectACharacterCommand(
      characterId,
      gmUserId,
      'Need more detail',
    );

    await handler.execute(command);

    expect(mockRepository.load).toHaveBeenCalledWith(characterId);
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
  });

  it('should create correct aggregate state after rejection', async () => {
    const command = new RejectACharacterCommand(
      characterId,
      gmUserId,
      'Need more detail',
    );

    await handler.execute(command);

    const [aggregate] = mockRepository.save.mock.calls[0];
    expect(aggregate.getId()).toBe(characterId);
    expect(aggregate.getStatus().isRejected()).toBe(true);
  });

  it('should emit CharacterRejected event with correct data', async () => {
    const command = new RejectACharacterCommand(
      characterId,
      gmUserId,
      'Need more detail',
    );

    await handler.execute(command);

    const [aggregate] = mockRepository.save.mock.calls[0];
    const events = aggregate.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('CharacterRejected');
    expect(events[0].characterId).toBe(characterId);
    expect(events[0].rejectedBy).toBe(gmUserId);
    expect(events[0].characterName).toBe('Gandalf');
    expect(events[0].reason).toBe('Need more detail');
    expect(events[0].rejectedAt).toBe('2026-03-08T12:00:00.000Z');
  });

  it('should propagate CharacterNotPendingException when character not pending', async () => {
    const rejectedCharacter = Character.loadFromHistory([
      ...pendingCharacterEvents,
      {
        type: 'CharacterRejected',
        data: {
          characterId,
          rejectedBy: gmUserId,
          characterName: 'Gandalf',
          reason: 'Already rejected',
          rejectedAt: '2026-03-07T12:00:00.000Z',
        },
      },
    ]);
    mockRepository.load.mockResolvedValue(rejectedCharacter);

    const command = new RejectACharacterCommand(
      characterId,
      gmUserId,
      'Need more detail',
    );

    await expect(handler.execute(command)).rejects.toThrow(
      CharacterNotPendingException,
    );

    expect(mockRepository.save).not.toHaveBeenCalled();
  });
});
