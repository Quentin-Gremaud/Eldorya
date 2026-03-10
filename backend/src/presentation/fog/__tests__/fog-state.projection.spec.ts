import { FogStateProjection } from '../projections/fog-state.projection.js';

describe('FogStateProjection', () => {
  let projection: FogStateProjection;
  let mockPrisma: {
    fogState: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    projectionCheckpoint: { findUnique: jest.Mock; upsert: jest.Mock };
  };

  const campaignId = '550e8400-e29b-41d4-a716-446655440000';
  const playerId = '660e8400-e29b-41d4-a716-446655440001';
  const mapLevelId = '770e8400-e29b-41d4-a716-446655440002';
  const fogZoneId = '880e8400-e29b-41d4-a716-446655440003';

  beforeEach(() => {
    mockPrisma = {
      fogState: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(undefined),
        update: jest.fn().mockResolvedValue(undefined),
      },
      projectionCheckpoint: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue(undefined),
      },
    };

    projection = new FogStateProjection(
      { getClient: jest.fn() } as any,
      mockPrisma as any,
    );
  });

  describe('handleFogStateInitialized', () => {
    it('should log initialization without creating rows', async () => {
      await projection.handleFogStateInitialized({
        campaignId,
        playerId,
        initializedAt: '2026-03-10T10:00:00.000Z',
      });

      expect(mockPrisma.fogState.create).not.toHaveBeenCalled();
    });
  });

  describe('handleFogZoneRevealed', () => {
    it('should create new fog state row when none exists', async () => {
      await projection.handleFogZoneRevealed({
        campaignId,
        playerId,
        mapLevelId,
        fogZoneId,
        x: 10,
        y: 20,
        width: 100,
        height: 200,
        revealedAt: '2026-03-10T10:00:00.000Z',
      });

      expect(mockPrisma.fogState.create).toHaveBeenCalledWith({
        data: {
          campaignId,
          playerId,
          mapLevelId,
          revealedZones: [
            { id: fogZoneId, x: 10, y: 20, width: 100, height: 200, revealedAt: '2026-03-10T10:00:00.000Z' },
          ],
        },
      });
    });

    it('should append zone when fog state row already exists', async () => {
      mockPrisma.fogState.findUnique.mockResolvedValue({
        campaignId,
        playerId,
        mapLevelId,
        revealedZones: [
          { id: 'existing-zone', x: 0, y: 0, width: 50, height: 50, revealedAt: '2026-03-10T09:00:00.000Z' },
        ],
      });

      await projection.handleFogZoneRevealed({
        campaignId,
        playerId,
        mapLevelId,
        fogZoneId,
        x: 10,
        y: 20,
        width: 100,
        height: 200,
        revealedAt: '2026-03-10T10:00:00.000Z',
      });

      expect(mockPrisma.fogState.update).toHaveBeenCalledWith({
        where: {
          campaignId_playerId_mapLevelId: { campaignId, playerId, mapLevelId },
        },
        data: {
          revealedZones: [
            { id: 'existing-zone', x: 0, y: 0, width: 50, height: 50, revealedAt: '2026-03-10T09:00:00.000Z' },
            { id: fogZoneId, x: 10, y: 20, width: 100, height: 200, revealedAt: '2026-03-10T10:00:00.000Z' },
          ],
        },
      });
    });

    it('should be idempotent — skip duplicate zone ids', async () => {
      mockPrisma.fogState.findUnique.mockResolvedValue({
        campaignId,
        playerId,
        mapLevelId,
        revealedZones: [
          { id: fogZoneId, x: 10, y: 20, width: 100, height: 200, revealedAt: '2026-03-10T10:00:00.000Z' },
        ],
      });

      await projection.handleFogZoneRevealed({
        campaignId,
        playerId,
        mapLevelId,
        fogZoneId,
        x: 10,
        y: 20,
        width: 100,
        height: 200,
        revealedAt: '2026-03-10T10:00:00.000Z',
      });

      expect(mockPrisma.fogState.update).not.toHaveBeenCalled();
      expect(mockPrisma.fogState.create).not.toHaveBeenCalled();
    });
  });

  describe('handleFogZoneHidden', () => {
    it('should remove zone from revealed zones', async () => {
      mockPrisma.fogState.findUnique.mockResolvedValue({
        campaignId,
        playerId,
        mapLevelId,
        revealedZones: [
          { id: fogZoneId, x: 10, y: 20, width: 100, height: 200, revealedAt: '2026-03-10T10:00:00.000Z' },
          { id: 'other-zone', x: 30, y: 40, width: 50, height: 50, revealedAt: '2026-03-10T09:00:00.000Z' },
        ],
      });

      await projection.handleFogZoneHidden({
        campaignId,
        playerId,
        mapLevelId,
        fogZoneId,
        hiddenAt: '2026-03-10T11:00:00.000Z',
      });

      expect(mockPrisma.fogState.update).toHaveBeenCalledWith({
        where: {
          campaignId_playerId_mapLevelId: { campaignId, playerId, mapLevelId },
        },
        data: {
          revealedZones: [
            { id: 'other-zone', x: 30, y: 40, width: 50, height: 50, revealedAt: '2026-03-10T09:00:00.000Z' },
          ],
        },
      });
    });

    it('should be idempotent — skip if fog state row does not exist', async () => {
      await projection.handleFogZoneHidden({
        campaignId,
        playerId,
        mapLevelId,
        fogZoneId,
        hiddenAt: '2026-03-10T11:00:00.000Z',
      });

      expect(mockPrisma.fogState.update).not.toHaveBeenCalled();
    });
  });
});
