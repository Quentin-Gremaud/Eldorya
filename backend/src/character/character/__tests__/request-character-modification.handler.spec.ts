import { RequestCharacterModificationHandler } from '../commands/request-character-modification.handler.js';
import { RequestCharacterModificationCommand } from '../commands/request-character-modification.command.js';
import { Character } from '../character.aggregate.js';
import { CharacterNotApprovedException } from '../exceptions/character-not-approved.exception.js';

describe('RequestCharacterModificationHandler', () => {
  let handler: RequestCharacterModificationHandler;
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
    handler = new RequestCharacterModificationHandler(
      mockRepository as any,
      mockClock,
    );
  });

  it('should persist CharacterModificationRequested event', async () => {
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

    const command = new RequestCharacterModificationCommand(
      'char-1',
      'player-1',
      'camp-1',
      { name: { current: 'Thorin', proposed: 'Thorin II' } },
      'Want a new name',
    );

    await handler.execute(command);

    expect(mockRepository.save).toHaveBeenCalledTimes(1);
    const savedCharacter = mockRepository.save.mock.calls[0][0] as Character;
    const events = savedCharacter.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('CharacterModificationRequested');
  });

  it('should throw when character is not approved', async () => {
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
    ]);

    mockRepository.load.mockResolvedValue(character);

    const command = new RequestCharacterModificationCommand(
      'char-1',
      'player-1',
      'camp-1',
      { name: { current: 'Thorin', proposed: 'Thorin II' } },
      null,
    );

    await expect(handler.execute(command)).rejects.toThrow(
      CharacterNotApprovedException,
    );
    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('should transition status to pending-revalidation', async () => {
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

    const command = new RequestCharacterModificationCommand(
      'char-1',
      'player-1',
      'camp-1',
      { name: { current: 'Thorin', proposed: 'Thorin II' } },
      null,
    );

    await handler.execute(command);

    const savedCharacter = mockRepository.save.mock.calls[0][0] as Character;
    expect(savedCharacter.getStatus().isPendingRevalidation()).toBe(true);
  });
});
