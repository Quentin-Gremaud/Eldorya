import { TokenProjection } from '../projections/token.projection.js';

describe('TokenProjection', () => {
  let projection: TokenProjection;
  let mockPrisma: {
    token: {
      createMany: jest.Mock;
      updateMany: jest.Mock;
      deleteMany: jest.Mock;
    };
    projectionCheckpoint: { findUnique: jest.Mock; upsert: jest.Mock };
  };

  const campaignId = '550e8400-e29b-41d4-a716-446655440000';
  const mapLevelId = '660e8400-e29b-41d4-a716-446655440001';
  const tokenId = '770e8400-e29b-41d4-a716-446655440001';

  beforeEach(() => {
    mockPrisma = {
      token: {
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      projectionCheckpoint: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue(undefined),
      },
    };

    projection = new TokenProjection(
      { getClient: jest.fn() } as any,
      mockPrisma as any,
    );
  });

  describe('handleTokenPlaced', () => {
    it('should createMany with skipDuplicates on placement (idempotent)', async () => {
      await projection.handleTokenPlaced({
        tokenId,
        campaignId,
        mapLevelId,
        x: 100,
        y: 200,
        tokenType: 'player',
        label: 'Warrior',
        placedAt: '2026-03-09T10:00:00.000Z',
      });

      expect(mockPrisma.token.createMany).toHaveBeenCalledWith({
        data: [
          {
            id: tokenId,
            campaignId,
            mapLevelId,
            x: 100,
            y: 200,
            tokenType: 'player',
            label: 'Warrior',
            destinationMapLevelId: null,
            createdAt: new Date('2026-03-09T10:00:00.000Z'),
          },
        ],
        skipDuplicates: true,
      });
    });

    it('should include destinationMapLevelId for location tokens', async () => {
      const destinationMapLevelId = '880e8400-e29b-41d4-a716-446655440001';
      await projection.handleTokenPlaced({
        tokenId,
        campaignId,
        mapLevelId,
        x: 100,
        y: 200,
        tokenType: 'location',
        label: 'Tavern Entrance',
        placedAt: '2026-03-09T10:00:00.000Z',
        destinationMapLevelId,
      });

      expect(mockPrisma.token.createMany).toHaveBeenCalledWith({
        data: [
          {
            id: tokenId,
            campaignId,
            mapLevelId,
            x: 100,
            y: 200,
            tokenType: 'location',
            label: 'Tavern Entrance',
            destinationMapLevelId,
            createdAt: new Date('2026-03-09T10:00:00.000Z'),
          },
        ],
        skipDuplicates: true,
      });
    });
  });

  describe('handleTokenMoved', () => {
    it('should updateMany for idempotent move', async () => {
      await projection.handleTokenMoved({
        tokenId,
        campaignId,
        mapLevelId,
        x: 300,
        y: 400,
        movedAt: '2026-03-09T11:00:00.000Z',
      });

      expect(mockPrisma.token.updateMany).toHaveBeenCalledWith({
        where: { id: tokenId, campaignId },
        data: { x: 300, y: 400 },
      });
    });
  });

  describe('handleLocationTokenLinked', () => {
    it('should updateMany with new destinationMapLevelId', async () => {
      const destinationMapLevelId = '880e8400-e29b-41d4-a716-446655440001';
      await projection.handleLocationTokenLinked({
        tokenId,
        campaignId,
        destinationMapLevelId,
        linkedAt: '2026-03-09T11:00:00.000Z',
      });

      expect(mockPrisma.token.updateMany).toHaveBeenCalledWith({
        where: { id: tokenId, campaignId },
        data: { destinationMapLevelId },
      });
    });
  });

  describe('handleTokenRemoved', () => {
    it('should deleteMany for idempotent removal', async () => {
      await projection.handleTokenRemoved({
        tokenId,
        campaignId,
        mapLevelId,
        removedAt: '2026-03-09T12:00:00.000Z',
      });

      expect(mockPrisma.token.deleteMany).toHaveBeenCalledWith({
        where: { id: tokenId, campaignId },
      });
    });
  });
});
