import { ActionProjection } from '../projections/action.projection.js';

describe('ActionProjection', () => {
  let projection: ActionProjection;
  let mockPrisma: {
    sessionPing: { create: jest.Mock };
    sessionAction: { createMany: jest.Mock; updateMany: jest.Mock; aggregate: jest.Mock };
    projectionCheckpoint: { findUnique: jest.Mock; upsert: jest.Mock };
    $transaction: jest.Mock;
  };

  const sessionId = '550e8400-e29b-41d4-a716-446655440000';
  const campaignId = '660e8400-e29b-41d4-a716-446655440001';
  const playerId = 'user_player_456';
  const gmUserId = 'user_gm_123';
  const actionId = '770e8400-e29b-41d4-a716-446655440002';

  beforeEach(() => {
    mockPrisma = {
      sessionPing: { create: jest.fn().mockResolvedValue({}) },
      sessionAction: {
        createMany: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({}),
        aggregate: jest.fn().mockResolvedValue({ _max: { queuePosition: null } }),
      },
      projectionCheckpoint: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue({}),
      },
      $transaction: jest.fn().mockResolvedValue([]),
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

      expect(mockPrisma.sessionAction.aggregate).toHaveBeenCalledWith({
        where: { sessionId, campaignId, status: 'pending' },
        _max: { queuePosition: true },
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
            queuePosition: 0,
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

    it('should set queuePosition to MAX+1 when existing pending actions', async () => {
      mockPrisma.sessionAction.aggregate.mockResolvedValue({ _max: { queuePosition: 2 } });

      await projection.handleActionProposed({
        actionId,
        sessionId,
        campaignId,
        playerId,
        actionType: 'move',
        description: 'I move',
        target: null,
        proposedAt: '2026-03-18T10:05:00.000Z',
      });

      const data = mockPrisma.sessionAction.createMany.mock.calls[0][0].data[0];
      expect(data.queuePosition).toBe(3);
    });

    it('should throw on missing required field', async () => {
      await expect(
        projection.handleActionProposed({ actionId }),
      ).rejects.toThrow('Invalid event data');
    });
  });

  describe('handleActionValidated', () => {
    it('should update action status to validated with narrative note', async () => {
      await projection.handleActionValidated({
        actionId,
        sessionId,
        campaignId,
        gmUserId,
        narrativeNote: 'The path opens before you',
        validatedAt: '2026-03-18T10:10:00.000Z',
      });

      expect(mockPrisma.sessionAction.updateMany).toHaveBeenCalledWith({
        where: { id: actionId, campaignId },
        data: {
          status: 'validated',
          narrativeNote: 'The path opens before you',
          resolvedAt: new Date('2026-03-18T10:10:00.000Z'),
        },
      });
    });

    it('should update action status to validated with null narrative note', async () => {
      await projection.handleActionValidated({
        actionId,
        sessionId,
        campaignId,
        gmUserId,
        narrativeNote: null,
        validatedAt: '2026-03-18T10:10:00.000Z',
      });

      const data = mockPrisma.sessionAction.updateMany.mock.calls[0][0].data;
      expect(data.narrativeNote).toBeNull();
    });

    it('should throw on missing required field', async () => {
      await expect(
        projection.handleActionValidated({ actionId }),
      ).rejects.toThrow('Invalid event data');
    });
  });

  describe('handleActionRejected', () => {
    it('should update action status to rejected with feedback', async () => {
      await projection.handleActionRejected({
        actionId,
        sessionId,
        campaignId,
        gmUserId,
        feedback: 'The dragon is too far away',
        rejectedAt: '2026-03-18T10:10:00.000Z',
      });

      expect(mockPrisma.sessionAction.updateMany).toHaveBeenCalledWith({
        where: { id: actionId, campaignId },
        data: {
          status: 'rejected',
          feedback: 'The dragon is too far away',
          resolvedAt: new Date('2026-03-18T10:10:00.000Z'),
        },
      });
    });

    it('should throw on missing required field', async () => {
      await expect(
        projection.handleActionRejected({ actionId }),
      ).rejects.toThrow('Invalid event data');
    });
  });

  describe('handleActionQueueReordered', () => {
    const actionId2 = '880e8400-e29b-41d4-a716-446655440003';

    it('should update queuePosition for all reordered actions in a transaction', async () => {
      await projection.handleActionQueueReordered({
        sessionId,
        campaignId,
        orderedActionIds: [actionId2, actionId],
        gmUserId,
        reorderedAt: '2026-03-18T10:10:00.000Z',
      });

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      const transactionArg = mockPrisma.$transaction.mock.calls[0][0];
      expect(transactionArg).toHaveLength(2);
    });

    it('should throw on missing orderedActionIds', async () => {
      await expect(
        projection.handleActionQueueReordered({
          sessionId,
          campaignId,
          gmUserId,
          reorderedAt: '2026-03-18T10:10:00.000Z',
        }),
      ).rejects.toThrow('Invalid event data');
    });
  });
});
