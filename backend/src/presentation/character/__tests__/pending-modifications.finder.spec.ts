import { PendingModificationsFinder } from '../finders/pending-modifications.finder.js';

describe('PendingModificationsFinder', () => {
  let finder: PendingModificationsFinder;
  let mockPrisma: { character: { findMany: jest.Mock } };

  beforeEach(() => {
    mockPrisma = {
      character: { findMany: jest.fn() },
    };
    finder = new PendingModificationsFinder(mockPrisma as any);
  });

  it('should return characters with pending_revalidation status and proposed changes', async () => {
    mockPrisma.character.findMany.mockResolvedValue([
      {
        id: 'char-1',
        userId: 'player-1',
        name: 'Thorin',
        race: 'Dwarf',
        characterClass: 'Warrior',
        background: 'Noble',
        stats: { strength: 14, dexterity: 10, constitution: 16, intelligence: 10, wisdom: 12, charisma: 8 },
        spells: [],
        status: 'pending_revalidation',
        proposedChanges: { name: { current: 'Thorin', proposed: 'Thorin II' } },
        createdAt: new Date('2026-03-01T00:00:00Z'),
        updatedAt: new Date('2026-03-05T00:00:00Z'),
      },
    ]);

    const result = await finder.findByCampaignId('camp-1');

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Thorin');
    expect(result[0].proposedChanges.name).toEqual({
      current: 'Thorin',
      proposed: 'Thorin II',
    });
  });

  it('should filter out characters without proposed changes', async () => {
    mockPrisma.character.findMany.mockResolvedValue([
      {
        id: 'char-1',
        userId: 'player-1',
        name: 'Thorin',
        race: 'Dwarf',
        characterClass: 'Warrior',
        background: 'Noble',
        stats: { strength: 14, dexterity: 10, constitution: 16, intelligence: 10, wisdom: 12, charisma: 8 },
        spells: [],
        status: 'pending_revalidation',
        proposedChanges: null,
        createdAt: new Date('2026-03-01T00:00:00Z'),
        updatedAt: new Date('2026-03-05T00:00:00Z'),
      },
    ]);

    const result = await finder.findByCampaignId('camp-1');

    expect(result).toHaveLength(0);
  });

  it('should return empty array when no pending modifications', async () => {
    mockPrisma.character.findMany.mockResolvedValue([]);

    const result = await finder.findByCampaignId('camp-1');

    expect(result).toHaveLength(0);
  });
});
