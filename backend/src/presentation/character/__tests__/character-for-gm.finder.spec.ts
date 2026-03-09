import { CharacterForGmFinder } from '../finders/character-for-gm.finder.js';

describe('CharacterForGmFinder', () => {
  let finder: CharacterForGmFinder;
  let mockPrisma: { character: { findFirst: jest.Mock } };

  const characterId = 'char-123';
  const campaignId = 'campaign-456';

  const dbCharacter = {
    id: characterId,
    userId: 'user-player-1',
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
    status: 'approved',
    rejectionReason: null,
    createdAt: new Date('2026-03-01T12:00:00.000Z'),
    updatedAt: new Date('2026-03-08T12:00:00.000Z'),
  };

  beforeEach(() => {
    mockPrisma = {
      character: {
        findFirst: jest.fn().mockResolvedValue(dbCharacter),
      },
    };

    finder = new CharacterForGmFinder(mockPrisma as any);
  });

  it('should query Prisma with characterId and campaignId', async () => {
    await finder.findByIdAndCampaign(characterId, campaignId);

    expect(mockPrisma.character.findFirst).toHaveBeenCalledWith({
      where: { id: characterId, campaignId },
    });
  });

  it('should return character detail for GM', async () => {
    const result = await finder.findByIdAndCampaign(characterId, campaignId);

    expect(result).toEqual({
      id: characterId,
      userId: 'user-player-1',
      name: 'Gandalf',
      race: 'Human',
      characterClass: 'Mage',
      background: 'A wandering wizard',
      stats: dbCharacter.stats,
      spells: ['Fireball', 'Shield'],
      status: 'approved',
      createdAt: dbCharacter.createdAt,
    });
  });

  it('should return null when character not found', async () => {
    mockPrisma.character.findFirst.mockResolvedValue(null);

    const result = await finder.findByIdAndCampaign(characterId, campaignId);

    expect(result).toBeNull();
  });
});
