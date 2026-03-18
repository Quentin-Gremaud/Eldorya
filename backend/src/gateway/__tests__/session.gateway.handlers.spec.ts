import { SessionGateway } from '../session.gateway.js';
import type { AuthenticatedSocket } from '../types/authenticated-socket.js';

describe('SessionGateway WS handlers', () => {
  let gateway: SessionGateway;
  let mockSessionFinder: { findById: jest.Mock; findActiveSessionByCampaign: jest.Mock };
  let mockCommandBus: { execute: jest.Mock };
  let mockPrisma: { campaignMember: { findFirst: jest.Mock } };

  const sessionId = '550e8400-e29b-41d4-a716-446655440000';
  const campaignId = '660e8400-e29b-41d4-a716-446655440001';
  const actionId = '770e8400-e29b-41d4-a716-446655440002';
  const gmUserId = 'user_gm_123';

  const liveSession = {
    id: sessionId,
    campaignId,
    gmUserId,
    mode: 'live',
  };

  const gmClient = { userId: gmUserId } as AuthenticatedSocket;
  const nonGmClient = { userId: 'user_other_999' } as AuthenticatedSocket;

  beforeEach(() => {
    mockSessionFinder = {
      findById: jest.fn().mockResolvedValue(liveSession),
      findActiveSessionByCampaign: jest.fn(),
    };
    mockCommandBus = { execute: jest.fn().mockResolvedValue(undefined) };
    mockPrisma = { campaignMember: { findFirst: jest.fn().mockResolvedValue({}) } };

    gateway = new SessionGateway(
      {} as any,
      {} as any,
      mockSessionFinder as any,
      mockCommandBus as any,
      mockPrisma as any,
    );
  });

  describe('validate-action', () => {
    it('should dispatch ValidateActionCommand for valid request', async () => {
      const result = await gateway.handleValidateAction(gmClient, {
        sessionId,
        campaignId,
        actionId,
        narrativeNote: 'Well done',
      });

      expect(result).toEqual({ success: true });
      expect(mockCommandBus.execute).toHaveBeenCalledTimes(1);
    });

    it('should validate without narrative note', async () => {
      const result = await gateway.handleValidateAction(gmClient, {
        sessionId,
        campaignId,
        actionId,
      });

      expect(result).toEqual({ success: true });
    });

    it('should reject non-GM caller', async () => {
      const result = await gateway.handleValidateAction(nonGmClient, {
        sessionId,
        campaignId,
        actionId,
      });

      expect(result).toEqual({ success: false, error: 'Only the GM can validate actions' });
      expect(mockCommandBus.execute).not.toHaveBeenCalled();
    });

    it('should reject invalid sessionId', async () => {
      const result = await gateway.handleValidateAction(gmClient, {
        sessionId: '',
        campaignId,
        actionId,
      });

      expect(result).toEqual({ success: false, error: 'Invalid sessionId' });
    });

    it('should reject invalid actionId', async () => {
      const result = await gateway.handleValidateAction(gmClient, {
        sessionId,
        campaignId,
        actionId: '',
      });

      expect(result).toEqual({ success: false, error: 'Invalid actionId' });
    });

    it('should reject too long narrative note', async () => {
      const result = await gateway.handleValidateAction(gmClient, {
        sessionId,
        campaignId,
        actionId,
        narrativeNote: 'a'.repeat(1001),
      });

      expect(result).toEqual({ success: false, error: 'Invalid narrativeNote' });
    });

    it('should reject when session not in live mode', async () => {
      mockSessionFinder.findById.mockResolvedValue({ ...liveSession, mode: 'preparation' });

      const result = await gateway.handleValidateAction(gmClient, {
        sessionId,
        campaignId,
        actionId,
      });

      expect(result).toEqual({ success: false, error: 'Session is not in live mode' });
    });
  });

  describe('reject-action', () => {
    it('should dispatch RejectActionCommand for valid request', async () => {
      const result = await gateway.handleRejectAction(gmClient, {
        sessionId,
        campaignId,
        actionId,
        feedback: 'Too far away',
      });

      expect(result).toEqual({ success: true });
      expect(mockCommandBus.execute).toHaveBeenCalledTimes(1);
    });

    it('should reject non-GM caller', async () => {
      const result = await gateway.handleRejectAction(nonGmClient, {
        sessionId,
        campaignId,
        actionId,
        feedback: 'reason',
      });

      expect(result).toEqual({ success: false, error: 'Only the GM can reject actions' });
    });

    it('should reject missing feedback', async () => {
      const result = await gateway.handleRejectAction(gmClient, {
        sessionId,
        campaignId,
        actionId,
        feedback: '',
      });

      expect(result).toEqual({ success: false, error: 'Feedback is required' });
    });

    it('should reject whitespace-only feedback', async () => {
      const result = await gateway.handleRejectAction(gmClient, {
        sessionId,
        campaignId,
        actionId,
        feedback: '   ',
      });

      expect(result).toEqual({ success: false, error: 'Feedback is required' });
    });

    it('should reject too long feedback', async () => {
      const result = await gateway.handleRejectAction(gmClient, {
        sessionId,
        campaignId,
        actionId,
        feedback: 'a'.repeat(1001),
      });

      expect(result).toEqual({ success: false, error: 'Feedback is too long' });
    });

    it('should reject invalid actionId', async () => {
      const result = await gateway.handleRejectAction(gmClient, {
        sessionId,
        campaignId,
        actionId: '',
        feedback: 'reason',
      });

      expect(result).toEqual({ success: false, error: 'Invalid actionId' });
    });
  });
});
