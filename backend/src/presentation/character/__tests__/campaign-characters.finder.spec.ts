import { CharacterStatusEnum } from '@prisma/client';
import { CampaignCharactersFinder } from '../finders/campaign-characters.finder.js';

describe('CampaignCharactersFinder', () => {
  let finder: CampaignCharactersFinder;
  let mockPrisma: { character: { findMany: jest.Mock } };

  const campaignId = 'campaign-456';

  const dbCharacters = [
    {
      id: 'char-1',
      userId: 'user-1',
      campaignId,
      name: 'Gandalf',
      race: 'Human',
      characterClass: 'Mage',
      background: 'A wandering wizard',
      stats: { strength: 8, dexterity: 14, constitution: 12, intelligence: 18, wisdom: 16, charisma: 10 },
      spells: ['Fireball'],
      status: CharacterStatusEnum.approved,
      rejectionReason: null,
      createdAt: new Date('2026-03-01T12:00:00.000Z'),
      updatedAt: new Date('2026-03-01T12:00:00.000Z'),
    },
    {
      id: 'char-2',
      userId: 'user-2',
      campaignId,
      name: 'Aragorn',
      race: 'Human',
      characterClass: 'Warrior',
      background: 'A ranger',
      stats: { strength: 18, dexterity: 14, constitution: 16, intelligence: 10, wisdom: 12, charisma: 14 },
      spells: [],
      status: CharacterStatusEnum.approved,
      rejectionReason: null,
      createdAt: new Date('2026-03-02T12:00:00.000Z'),
      updatedAt: new Date('2026-03-02T12:00:00.000Z'),
    },
  ];

  beforeEach(() => {
    mockPrisma = {
      character: {
        findMany: jest.fn().mockResolvedValue(dbCharacters),
      },
    };

    finder = new CampaignCharactersFinder(mockPrisma as any);
  });

  it('should query Prisma for approved characters in campaign', async () => {
    await finder.findApprovedByCampaignId(campaignId);

    expect(mockPrisma.character.findMany).toHaveBeenCalledWith({
      where: { campaignId, status: CharacterStatusEnum.approved },
      orderBy: { createdAt: 'asc' },
    });
  });

  it('should return mapped character summaries', async () => {
    const result = await finder.findApprovedByCampaignId(campaignId);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('char-1');
    expect(result[0].name).toBe('Gandalf');
    expect(result[1].name).toBe('Aragorn');
    expect(result[0].createdAt).toBe('2026-03-01T12:00:00.000Z');
  });

  it('should return empty array when no approved characters', async () => {
    mockPrisma.character.findMany.mockResolvedValue([]);

    const result = await finder.findApprovedByCampaignId(campaignId);

    expect(result).toEqual([]);
  });
});
