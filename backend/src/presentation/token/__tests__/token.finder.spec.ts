import { TokenFinder } from '../finders/token.finder.js';

describe('TokenFinder', () => {
  let finder: TokenFinder;
  let mockPrisma: { token: { findMany: jest.Mock } };

  const campaignId = '550e8400-e29b-41d4-a716-446655440000';
  const mapLevelId = '660e8400-e29b-41d4-a716-446655440001';

  beforeEach(() => {
    mockPrisma = {
      token: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: '770e8400-e29b-41d4-a716-446655440001',
            campaignId,
            mapLevelId,
            x: 100,
            y: 200,
            tokenType: 'player',
            label: 'Warrior',
            createdAt: new Date('2026-03-09T10:00:00.000Z'),
            updatedAt: new Date('2026-03-09T10:00:00.000Z'),
          },
        ]),
      },
    };

    finder = new TokenFinder(mockPrisma as any);
  });

  it('should query by campaignId and mapLevelId', async () => {
    await finder.findByCampaignAndMapLevel(campaignId, mapLevelId);

    expect(mockPrisma.token.findMany).toHaveBeenCalledWith({
      where: { campaignId, mapLevelId },
      orderBy: { createdAt: 'asc' },
    });
  });

  it('should return tokens with ISO date strings', async () => {
    const result = await finder.findByCampaignAndMapLevel(campaignId, mapLevelId);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('770e8400-e29b-41d4-a716-446655440001');
    expect(result[0].createdAt).toBe('2026-03-09T10:00:00.000Z');
    expect(result[0].updatedAt).toBe('2026-03-09T10:00:00.000Z');
  });

  it('should return empty array when no tokens found', async () => {
    mockPrisma.token.findMany.mockResolvedValue([]);

    const result = await finder.findByCampaignAndMapLevel(campaignId, mapLevelId);
    expect(result).toEqual([]);
  });
});
