import { ModifyCharacterByGmHandler } from '../commands/modify-character-by-gm.handler.js';
import { ModifyCharacterByGmCommand } from '../commands/modify-character-by-gm.command.js';
import { CharacterRepository } from '../character.repository.js';
import { Character } from '../character.aggregate.js';
import { CharacterNotApprovedException } from '../exceptions/character-not-approved.exception.js';
import type { Clock } from '../../../shared/clock.js';

describe('ModifyCharacterByGmHandler', () => {
  let handler: ModifyCharacterByGmHandler;
  let mockRepository: { load: jest.Mock; save: jest.Mock };
  let mockClock: Clock;

  const characterId = 'char-123';
  const userId = 'user-player-1';
  const campaignId = 'campaign-456';
  const gmUserId = 'gm-user-1';

  const approvedCharacterEvents = [
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
    {
      type: 'CharacterApproved',
      data: {
        characterId,
        approvedBy: gmUserId,
        characterName: 'Gandalf',
        approvedAt: '2026-03-07T12:00:00.000Z',
      },
    },
  ];

  beforeEach(() => {
    mockClock = {
      now: jest.fn().mockReturnValue(new Date('2026-03-08T14:00:00.000Z')),
    };

    mockRepository = {
      load: jest
        .fn()
        .mockResolvedValue(
          Character.loadFromHistory(approvedCharacterEvents),
        ),
      save: jest.fn().mockResolvedValue(undefined),
    };

    handler = new ModifyCharacterByGmHandler(
      mockRepository as unknown as CharacterRepository,
      mockClock,
    );
  });

  it('should call repository.load then repository.save', async () => {
    const command = new ModifyCharacterByGmCommand(characterId, gmUserId, {
      name: 'Gandalf the White',
    });

    await handler.execute(command);

    expect(mockRepository.load).toHaveBeenCalledWith(characterId);
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
  });

  it('should emit CharacterModifiedByGM event with correct data', async () => {
    const command = new ModifyCharacterByGmCommand(characterId, gmUserId, {
      name: 'Gandalf the White',
    });

    await handler.execute(command);

    const [aggregate] = mockRepository.save.mock.calls[0];
    const events = aggregate.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('CharacterModifiedByGM');
    expect(events[0].characterId).toBe(characterId);
    expect(events[0].modifiedBy).toBe(gmUserId);
    expect(events[0].modifications.name).toBe('Gandalf the White');
    expect(events[0].previousValues.name).toBe('Gandalf');
  });

  it('should propagate CharacterNotApprovedException when character not approved', async () => {
    const pendingCharacter = Character.loadFromHistory([
      approvedCharacterEvents[0],
    ]);
    mockRepository.load.mockResolvedValue(pendingCharacter);

    const command = new ModifyCharacterByGmCommand(characterId, gmUserId, {
      name: 'Gandalf the White',
    });

    await expect(handler.execute(command)).rejects.toThrow(
      CharacterNotApprovedException,
    );

    expect(mockRepository.save).not.toHaveBeenCalled();
  });
});
