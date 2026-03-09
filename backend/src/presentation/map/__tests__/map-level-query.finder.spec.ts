import { MapLevelQueryFinder } from '../finders/map-level-query.finder.js';

describe('MapLevelQueryFinder', () => {
  let finder: MapLevelQueryFinder;
  let mockPrisma: any;

  const campaignId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    mockPrisma = {
      mapLevel: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    finder = new MapLevelQueryFinder(mockPrisma);
  });

  it('should query map levels by campaignId', async () => {
    await finder.findByCampaignId(campaignId);

    expect(mockPrisma.mapLevel.findMany).toHaveBeenCalledWith({
      where: { campaignId },
      orderBy: [{ depth: 'asc' }, { name: 'asc' }],
    });
  });

  it('should return map levels ordered by depth and name', async () => {
    const levels = [
      { id: 'l1', campaignId, name: 'World', parentId: null, depth: 0, createdAt: new Date(), updatedAt: new Date() },
      { id: 'l2', campaignId, name: 'Continent', parentId: 'l1', depth: 1, createdAt: new Date(), updatedAt: new Date() },
    ];
    mockPrisma.mapLevel.findMany.mockResolvedValue(levels);

    const result = await finder.findByCampaignId(campaignId);

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('World');
    expect(result[1].name).toBe('Continent');
  });

  it('should isolate by campaignId (not return other campaigns)', async () => {
    mockPrisma.mapLevel.findMany.mockResolvedValue([]);

    const result = await finder.findByCampaignId('other-campaign');

    expect(mockPrisma.mapLevel.findMany).toHaveBeenCalledWith({
      where: { campaignId: 'other-campaign' },
      orderBy: [{ depth: 'asc' }, { name: 'asc' }],
    });
    expect(result).toHaveLength(0);
  });
});
