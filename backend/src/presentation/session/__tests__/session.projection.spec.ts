import { SessionProjection } from '../projections/session.projection.js';

describe('SessionProjection', () => {
  let projection: SessionProjection;
  let mockPrisma: {
    session: {
      createMany: jest.Mock;
      updateMany: jest.Mock;
    };
    projectionCheckpoint: {
      upsert: jest.Mock;
    };
  };

  const sessionId = '550e8400-e29b-41d4-a716-446655440000';
  const campaignId = '660e8400-e29b-41d4-a716-446655440001';
  const gmUserId = 'user_gm_123';

  beforeEach(() => {
    mockPrisma = {
      session: {
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      projectionCheckpoint: {
        upsert: jest.fn().mockResolvedValue({}),
      },
    };

    projection = new SessionProjection({} as any, mockPrisma as any);
  });

  describe('handleSessionStarted', () => {
    it('should create session in read model', async () => {
      await projection.handleSessionStarted({
        sessionId,
        campaignId,
        gmUserId,
        mode: 'preparation',
        startedAt: '2026-03-14T10:00:00.000Z',
      });

      expect(mockPrisma.session.createMany).toHaveBeenCalledWith({
        data: [
          {
            id: sessionId,
            campaignId,
            gmUserId,
            mode: 'preparation',
            status: 'active',
            startedAt: new Date('2026-03-14T10:00:00.000Z'),
          },
        ],
        skipDuplicates: true,
      });
    });
  });

  describe('handleSessionModeChanged', () => {
    it('should update session mode in read model', async () => {
      await projection.handleSessionModeChanged({
        sessionId,
        campaignId,
        newMode: 'live',
        changedAt: '2026-03-14T11:00:00.000Z',
      });

      expect(mockPrisma.session.updateMany).toHaveBeenCalledWith({
        where: { id: sessionId },
        data: { mode: 'live' },
      });
    });
  });
});
