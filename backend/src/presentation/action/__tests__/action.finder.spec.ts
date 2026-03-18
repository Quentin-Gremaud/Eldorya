import { ActionFinder } from '../finders/action.finder.js';

describe('ActionFinder', () => {
  let finder: ActionFinder;
  let mockPrisma: {
    sessionAction: { findMany: jest.Mock };
    sessionPing: { findFirst: jest.Mock };
  };

  const sessionId = '550e8400-e29b-41d4-a716-446655440000';
  const campaignId = '660e8400-e29b-41d4-a716-446655440001';
  const playerId = 'user_player_456';

  beforeEach(() => {
    mockPrisma = {
      sessionAction: { findMany: jest.fn().mockResolvedValue([]) },
      sessionPing: { findFirst: jest.fn().mockResolvedValue(null) },
    };

    finder = new ActionFinder(mockPrisma as any);
  });

  describe('findPendingActionsBySession', () => {
    it('should return pending actions for the session', async () => {
      const proposedAt = new Date('2026-03-18T10:05:00.000Z');
      mockPrisma.sessionAction.findMany.mockResolvedValue([
        {
          id: 'action-1',
          sessionId,
          campaignId,
          playerId,
          actionType: 'move',
          description: 'I move north',
          target: null,
          status: 'pending',
          proposedAt,
        },
      ]);

      const result = await finder.findPendingActionsBySession(sessionId, campaignId);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('action-1');
      expect(result[0].proposedAt).toBe(proposedAt.toISOString());
      expect(mockPrisma.sessionAction.findMany).toHaveBeenCalledWith({
        where: { sessionId, campaignId, status: 'pending' },
        orderBy: { queuePosition: 'asc' },
      });
    });

    it('should return empty array when no pending actions', async () => {
      const result = await finder.findPendingActionsBySession(sessionId, campaignId);
      expect(result).toEqual([]);
    });
  });

  describe('findResolvedActionsBySession', () => {
    it('should return validated and rejected actions', async () => {
      const proposedAt = new Date('2026-03-18T10:00:00.000Z');
      const resolvedAt = new Date('2026-03-18T10:05:00.000Z');
      mockPrisma.sessionAction.findMany.mockResolvedValue([
        {
          id: 'action-1',
          sessionId,
          campaignId,
          playerId,
          actionType: 'move',
          description: 'I move north',
          target: null,
          status: 'validated',
          narrativeNote: 'Well done',
          feedback: null,
          proposedAt,
          resolvedAt,
        },
        {
          id: 'action-2',
          sessionId,
          campaignId,
          playerId,
          actionType: 'attack',
          description: 'I attack',
          target: null,
          status: 'rejected',
          narrativeNote: null,
          feedback: 'Too far',
          proposedAt,
          resolvedAt,
        },
      ]);

      const result = await finder.findResolvedActionsBySession(sessionId, campaignId);

      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('validated');
      expect(result[0].narrativeNote).toBe('Well done');
      expect(result[1].status).toBe('rejected');
      expect(result[1].feedback).toBe('Too far');
      expect(mockPrisma.sessionAction.findMany).toHaveBeenCalledWith({
        where: {
          sessionId,
          campaignId,
          status: { in: ['validated', 'rejected'] },
        },
        orderBy: { resolvedAt: 'desc' },
      });
    });

    it('should return empty array when no resolved actions', async () => {
      const result = await finder.findResolvedActionsBySession(sessionId, campaignId);
      expect(result).toEqual([]);
    });
  });

  describe('findLastPingForPlayer', () => {
    it('should return the most recent ping for a player', async () => {
      const pingedAt = new Date('2026-03-18T10:00:00.000Z');
      mockPrisma.sessionPing.findFirst.mockResolvedValue({
        playerId,
        pingedAt,
      });

      const result = await finder.findLastPingForPlayer(sessionId, campaignId, playerId);

      expect(result).toEqual({
        playerId,
        pingedAt: pingedAt.toISOString(),
      });
      expect(mockPrisma.sessionPing.findFirst).toHaveBeenCalledWith({
        where: { sessionId, campaignId, playerId },
        orderBy: { pingedAt: 'desc' },
      });
    });

    it('should return null when player has not been pinged', async () => {
      const result = await finder.findLastPingForPlayer(sessionId, campaignId, playerId);
      expect(result).toBeNull();
    });
  });

  describe('findCurrentPingStatus', () => {
    it('should return the most recent ping for the session', async () => {
      const pingedAt = new Date('2026-03-18T10:00:00.000Z');
      mockPrisma.sessionPing.findFirst.mockResolvedValue({
        playerId,
        pingedAt,
      });

      const result = await finder.findCurrentPingStatus(sessionId, campaignId);

      expect(result).toEqual({
        playerId,
        pingedAt: pingedAt.toISOString(),
      });
    });

    it('should return null when no pings exist', async () => {
      const result = await finder.findCurrentPingStatus(sessionId, campaignId);
      expect(result).toBeNull();
    });
  });
});
