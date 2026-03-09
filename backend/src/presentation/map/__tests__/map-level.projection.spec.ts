import { MapLevelProjection } from '../projections/map-level.projection.js';

describe('MapLevelProjection', () => {
  let projection: MapLevelProjection;
  let mockPrisma: any;
  let mockKurrentDb: any;

  beforeEach(() => {
    mockPrisma = {
      mapLevel: {
        upsert: jest.fn().mockResolvedValue(undefined),
        update: jest.fn().mockResolvedValue(undefined),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      projectionCheckpoint: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
    };

    mockKurrentDb = {
      getClient: jest.fn().mockReturnValue({
        subscribeToAll: jest.fn(),
      }),
    };

    projection = new MapLevelProjection(mockKurrentDb, mockPrisma);
  });

  describe('handleMapLevelCreated', () => {
    it('should upsert map level into read model', async () => {
      const data = {
        mapLevelId: 'level-1',
        campaignId: 'campaign-1',
        name: 'World',
        parentId: null,
        depth: 0,
        createdAt: '2026-03-08T10:00:00.000Z',
      };

      await (projection as any).handleMapLevelCreated(data);

      expect(mockPrisma.mapLevel.upsert).toHaveBeenCalledWith({
        where: { id: 'level-1' },
        create: {
          id: 'level-1',
          campaignId: 'campaign-1',
          name: 'World',
          parentId: null,
          depth: 0,
          createdAt: new Date('2026-03-08T10:00:00.000Z'),
        },
        update: {
          name: 'World',
          parentId: null,
          depth: 0,
        },
      });
    });

    it('should handle map level with parent', async () => {
      const data = {
        mapLevelId: 'level-2',
        campaignId: 'campaign-1',
        name: 'Continent',
        parentId: 'level-1',
        depth: 1,
        createdAt: '2026-03-08T10:00:00.000Z',
      };

      await (projection as any).handleMapLevelCreated(data);

      expect(mockPrisma.mapLevel.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            parentId: 'level-1',
            depth: 1,
          }),
        }),
      );
    });
  });

  describe('handleMapLevelRenamed', () => {
    it('should update map level name in read model', async () => {
      const data = {
        mapLevelId: 'level-1',
        newName: 'New World',
        renamedAt: '2026-03-08T11:00:00.000Z',
      };

      await (projection as any).handleMapLevelRenamed(data);

      expect(mockPrisma.mapLevel.updateMany).toHaveBeenCalledWith({
        where: { id: 'level-1' },
        data: { name: 'New World' },
      });
    });
  });

  describe('handleMapLevelBackgroundSet', () => {
    it('should update background image URL in read model', async () => {
      const data = {
        mapLevelId: 'level-1',
        campaignId: 'campaign-1',
        backgroundImageUrl: 'https://cdn.example.com/bg.jpg',
        previousBackgroundImageUrl: null,
        setAt: '2026-03-08T12:00:00.000Z',
      };

      await (projection as any).handleMapLevelBackgroundSet(data);

      expect(mockPrisma.mapLevel.updateMany).toHaveBeenCalledWith({
        where: { id: 'level-1' },
        data: { backgroundImageUrl: 'https://cdn.example.com/bg.jpg' },
      });
    });

    it('should be idempotent on repeated calls', async () => {
      const data = {
        mapLevelId: 'level-1',
        campaignId: 'campaign-1',
        backgroundImageUrl: 'https://cdn.example.com/bg.jpg',
        previousBackgroundImageUrl: null,
        setAt: '2026-03-08T12:00:00.000Z',
      };

      await (projection as any).handleMapLevelBackgroundSet(data);
      await (projection as any).handleMapLevelBackgroundSet(data);

      expect(mockPrisma.mapLevel.updateMany).toHaveBeenCalledTimes(2);
    });
  });
});
