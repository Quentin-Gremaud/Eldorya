import { ActionProjection } from '../projections/action.projection.js';

describe('ActionProjection', () => {
  let projection: ActionProjection;
  let mockPrisma: {
    sessionPing: { create: jest.Mock };
    sessionAction: { createMany: jest.Mock };
    projectionCheckpoint: { findUnique: jest.Mock; upsert: jest.Mock };
  };

  const sessionId = '550e8400-e29b-41d4-a716-446655440000';
  const campaignId = '660e8400-e29b-41d4-a716-446655440001';
  const playerId = 'user_player_456';
  const gmUserId = 'user_gm_123';
  const actionId = '770e8400-e29b-41d4-a716-446655440002';

  beforeEach(() => {
    mockPrisma = {
      sessionPing: { create: jest.fn().mockResolvedValue({}) },
      sessionAction: { createMany: jest.fn().mockResolvedValue({}) },
      projectionCheckpoint: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue({}),
      },
    };

    projection = new ActionProjection(
      {} as any, // KurrentDb not used in handler methods directly
      mockPrisma as any,
    );
  });

  describe('handlePlayerPinged', () => {
    it('should insert a session ping record', async () => {
      await projection.handlePlayerPinged({
        sessionId,
        campaignId,
        playerId,
        gmUserId,
        pingedAt: '2026-03-18T10:00:00.000Z',
      });

      expect(mockPrisma.sessionPing.create).toHaveBeenCalledWith({
        data: {
          sessionId,
          campaignId,
          playerId,
          gmUserId,
          pingedAt: new Date('2026-03-18T10:00:00.000Z'),
        },
      });
    });

    it('should throw on missing required field', async () => {
      await expect(
        projection.handlePlayerPinged({ sessionId }),
      ).rejects.toThrow('Invalid event data');
    });
  });

  describe('handleActionProposed', () => {
    it('should insert a session action record', async () => {
      await projection.handleActionProposed({
        actionId,
        sessionId,
        campaignId,
        playerId,
        actionType: 'move',
        description: 'I move north',
        target: null,
        proposedAt: '2026-03-18T10:05:00.000Z',
      });

      expect(mockPrisma.sessionAction.createMany).toHaveBeenCalledWith({
        data: [
          {
            id: actionId,
            sessionId,
            campaignId,
            playerId,
            actionType: 'move',
            description: 'I move north',
            target: null,
            status: 'pending',
            proposedAt: new Date('2026-03-18T10:05:00.000Z'),
          },
        ],
        skipDuplicates: true,
      });
    });

    it('should handle action with target', async () => {
      await projection.handleActionProposed({
        actionId,
        sessionId,
        campaignId,
        playerId,
        actionType: 'attack',
        description: 'I attack goblin',
        target: 'token-goblin-1',
        proposedAt: '2026-03-18T10:05:00.000Z',
      });

      const data = mockPrisma.sessionAction.createMany.mock.calls[0][0].data[0];
      expect(data.target).toBe('token-goblin-1');
    });

    it('should throw on missing required field', async () => {
      await expect(
        projection.handleActionProposed({ actionId }),
      ).rejects.toThrow('Invalid event data');
    });
  });
});
