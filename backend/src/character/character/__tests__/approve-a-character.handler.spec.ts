import { ApproveACharacterHandler } from '../commands/approve-a-character.handler.js';
import { ApproveACharacterCommand } from '../commands/approve-a-character.command.js';
import { CharacterRepository } from '../character.repository.js';
import { Character } from '../character.aggregate.js';
import { CharacterNotPendingException } from '../exceptions/character-not-pending.exception.js';
import type { Clock } from '../../../shared/clock.js';

describe('ApproveACharacterHandler', () => {
  let handler: ApproveACharacterHandler;
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

    handler = new ApproveACharacterHandler(
      mockRepository as unknown as CharacterRepository,
      mockClock,
    );
  });

  it('should call repository.load then repository.save', async () => {
    const command = new ApproveACharacterCommand(characterId, gmUserId);

    await handler.execute(command);

    expect(mockRepository.load).toHaveBeenCalledWith(characterId);
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
  });

  it('should create correct aggregate state after approval', async () => {
    const command = new ApproveACharacterCommand(characterId, gmUserId);

    await handler.execute(command);

    const [aggregate] = mockRepository.save.mock.calls[0];
    expect(aggregate.getId()).toBe(characterId);
    expect(aggregate.getStatus().isApproved()).toBe(true);
  });

  it('should emit CharacterApproved event with correct data', async () => {
    const command = new ApproveACharacterCommand(characterId, gmUserId);

    await handler.execute(command);

    const [aggregate] = mockRepository.save.mock.calls[0];
    const events = aggregate.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('CharacterApproved');
    expect(events[0].characterId).toBe(characterId);
    expect(events[0].approvedBy).toBe(gmUserId);
    expect(events[0].characterName).toBe('Gandalf');
    expect(events[0].approvedAt).toBe('2026-03-08T12:00:00.000Z');
  });

  it('should propagate CharacterNotPendingException when character not pending', async () => {
    const approvedCharacter = Character.loadFromHistory([
      ...pendingCharacterEvents,
      {
        type: 'CharacterApproved',
        data: {
          characterId,
          approvedBy: gmUserId,
          characterName: 'Gandalf',
          approvedAt: '2026-03-07T12:00:00.000Z',
        },
      },
    ]);
    mockRepository.load.mockResolvedValue(approvedCharacter);

    const command = new ApproveACharacterCommand(characterId, gmUserId);

    await expect(handler.execute(command)).rejects.toThrow(
      CharacterNotPendingException,
    );

    expect(mockRepository.save).not.toHaveBeenCalled();
  });
});
