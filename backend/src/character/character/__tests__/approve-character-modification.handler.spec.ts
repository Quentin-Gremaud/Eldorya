import { ApproveCharacterModificationHandler } from '../commands/approve-character-modification.handler.js';
import { ApproveCharacterModificationCommand } from '../commands/approve-character-modification.command.js';
import { Character } from '../character.aggregate.js';
import { CharacterNotPendingRevalidationException } from '../exceptions/character-not-pending-revalidation.exception.js';

describe('ApproveCharacterModificationHandler', () => {
  let handler: ApproveCharacterModificationHandler;
  let mockRepository: { load: jest.Mock; save: jest.Mock };
  let mockClock: { now: jest.Mock };

  beforeEach(() => {
    mockRepository = {
      load: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };
    mockClock = {
      now: jest.fn().mockReturnValue(new Date('2026-03-08T12:00:00Z')),
    };
    handler = new ApproveCharacterModificationHandler(
      mockRepository as any,
      mockClock,
    );
  });

  function buildCharacterWithModificationRequest() {
    return Character.loadFromHistory([
      {
        type: 'CharacterCreated',
        data: {
          characterId: 'char-1',
          userId: 'player-1',
          campaignId: 'camp-1',
          name: 'Thorin',
          race: 'Dwarf',
          characterClass: 'Warrior',
          background: 'Noble',
          stats: { strength: 14, dexterity: 10, constitution: 16, intelligence: 10, wisdom: 12, charisma: 8 },
          spells: [],
          status: 'pending',
          createdAt: '2026-03-01T00:00:00Z',
        },
      },
      {
        type: 'CharacterApproved',
        data: {
          characterId: 'char-1',
          approvedBy: 'gm-1',
          characterName: 'Thorin',
          approvedAt: '2026-03-02T00:00:00Z',
        },
      },
      {
        type: 'CharacterModificationRequested',
        data: {
          characterId: 'char-1',
          playerId: 'player-1',
          campaignId: 'camp-1',
          characterName: 'Thorin',
          proposedChanges: { name: { current: 'Thorin', proposed: 'Thorin II' } },
          reason: null,
          requestedAt: '2026-03-05T00:00:00Z',
        },
      },
    ]);
  }

  it('should apply changes and transition to approved', async () => {
    const character = buildCharacterWithModificationRequest();
    mockRepository.load.mockResolvedValue(character);

    await handler.execute(
      new ApproveCharacterModificationCommand('char-1', 'camp-1', 'gm-1'),
    );

    const saved = mockRepository.save.mock.calls[0][0] as Character;
    expect(saved.getStatus().isApproved()).toBe(true);
    expect(saved.getName()).toBe('Thorin II');
    const events = saved.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('CharacterModificationApproved');
  });

  it('should throw when character is not pending-revalidation', async () => {
    const character = Character.loadFromHistory([
      {
        type: 'CharacterCreated',
        data: {
          characterId: 'char-1',
          userId: 'player-1',
          campaignId: 'camp-1',
          name: 'Thorin',
          race: 'Dwarf',
          characterClass: 'Warrior',
          background: 'Noble',
          stats: { strength: 14, dexterity: 10, constitution: 16, intelligence: 10, wisdom: 12, charisma: 8 },
          spells: [],
          status: 'pending',
          createdAt: '2026-03-01T00:00:00Z',
        },
      },
      {
        type: 'CharacterApproved',
        data: {
          characterId: 'char-1',
          approvedBy: 'gm-1',
          characterName: 'Thorin',
          approvedAt: '2026-03-02T00:00:00Z',
        },
      },
    ]);

    mockRepository.load.mockResolvedValue(character);

    await expect(
      handler.execute(
        new ApproveCharacterModificationCommand('char-1', 'camp-1', 'gm-1'),
      ),
    ).rejects.toThrow(CharacterNotPendingRevalidationException);
    expect(mockRepository.save).not.toHaveBeenCalled();
  });
});
