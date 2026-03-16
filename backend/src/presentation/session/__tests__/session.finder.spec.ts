import { SessionFinder } from '../finders/session.finder.js';

describe('SessionFinder', () => {
  let finder: SessionFinder;
  let mockPrisma: {
    session: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
    };
  };

  const campaignId = '550e8400-e29b-41d4-a716-446655440000';
  const sessionId = '660e8400-e29b-41d4-a716-446655440001';
  const gmUserId = 'user_gm_123';
  const startedAt = new Date('2026-03-14T10:00:00.000Z');

  beforeEach(() => {
    mockPrisma = {
      session: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    finder = new SessionFinder(mockPrisma as any);
  });

  describe('findActiveSessionByCampaign', () => {
    it('should return session when active session exists', async () => {
      mockPrisma.session.findFirst.mockResolvedValue({
        id: sessionId,
        campaignId,
        gmUserId,
        mode: 'preparation',
        status: 'active',
        startedAt,
        endedAt: null,
      });

      const result = await finder.findActiveSessionByCampaign(campaignId);

      expect(result).toEqual({
        id: sessionId,
        campaignId,
        gmUserId,
        mode: 'preparation',
        status: 'active',
        startedAt: startedAt.toISOString(),
        endedAt: null,
      });
      expect(mockPrisma.session.findFirst).toHaveBeenCalledWith({
        where: { campaignId, status: 'active' },
      });
    });

    it('should return null when no active session exists', async () => {
      mockPrisma.session.findFirst.mockResolvedValue(null);

      const result = await finder.findActiveSessionByCampaign(campaignId);

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return session when found', async () => {
      mockPrisma.session.findUnique.mockResolvedValue({
        id: sessionId,
        campaignId,
        gmUserId,
        mode: 'live',
        status: 'active',
        startedAt,
        endedAt: null,
      });

      const result = await finder.findById(sessionId);

      expect(result).toEqual({
        id: sessionId,
        campaignId,
        gmUserId,
        mode: 'live',
        status: 'active',
        startedAt: startedAt.toISOString(),
        endedAt: null,
      });
    });

    it('should return null when session not found', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(null);

      const result = await finder.findById(sessionId);

      expect(result).toBeNull();
    });
  });
});
