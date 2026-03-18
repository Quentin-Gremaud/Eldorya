import { SessionGateway } from '../session.gateway.js';
import { RoomManagerService } from '../services/room-manager.service.js';
import { PingPlayerCommand } from '../../session/action-pipeline/commands/ping-player.command.js';
import { ProposeActionCommand } from '../../session/action-pipeline/commands/propose-action.command.js';
import type { SessionFinder } from '../../presentation/session/finders/session.finder.js';
import type { AuthenticatedSocket } from '../types/authenticated-socket.js';

describe('SessionGateway - action handlers', () => {
  let gateway: SessionGateway;
  let mockSessionFinder: { findActiveSessionByCampaign: jest.Mock; findById: jest.Mock };
  let mockCommandBus: { execute: jest.Mock };
  let mockPrisma: { campaignMember: { findFirst: jest.Mock } };
  let mockClient: AuthenticatedSocket;

  const sessionId = '550e8400-e29b-41d4-a716-446655440000';
  const campaignId = '660e8400-e29b-41d4-a716-446655440001';
  const gmUserId = 'user_gm_123';
  const playerId = 'user_player_456';
  const actionId = '770e8400-e29b-41d4-a716-446655440002';

  const liveSession = {
    id: sessionId,
    campaignId,
    gmUserId,
    mode: 'live',
    status: 'active',
    startedAt: '2026-03-18T10:00:00.000Z',
    endedAt: null,
  };

  beforeEach(() => {
    mockSessionFinder = {
      findActiveSessionByCampaign: jest.fn(),
      findById: jest.fn().mockResolvedValue(liveSession),
    };

    mockCommandBus = {
      execute: jest.fn().mockResolvedValue(undefined),
    };

    mockPrisma = {
      campaignMember: {
        findFirst: jest.fn().mockResolvedValue({ id: 'member-1', campaignId, userId: playerId, role: 'player' }),
      },
    };

    gateway = new SessionGateway(
      {} as any,
      new RoomManagerService(),
      mockSessionFinder as unknown as SessionFinder,
      mockCommandBus as any,
      mockPrisma as any,
    );

    mockClient = {
      id: 'socket-1',
      userId: gmUserId,
      join: jest.fn().mockResolvedValue(undefined),
    } as unknown as AuthenticatedSocket;
  });

  describe('ping-player', () => {
    it('should dispatch PingPlayerCommand when GM pings', async () => {
      const result = await gateway.handlePingPlayer(mockClient, {
        sessionId,
        campaignId,
        playerId,
      });

      expect(result).toEqual({ success: true });
      expect(mockCommandBus.execute).toHaveBeenCalledTimes(1);
      const command = mockCommandBus.execute.mock.calls[0][0];
      expect(command).toBeInstanceOf(PingPlayerCommand);
      expect(command.sessionId).toBe(sessionId);
      expect(command.playerId).toBe(playerId);
    });

    it('should reject ping from non-GM', async () => {
      mockClient.userId = playerId;

      const result = await gateway.handlePingPlayer(mockClient, {
        sessionId,
        campaignId,
        playerId: 'other-player',
      });

      expect(result).toEqual({ success: false, error: 'Only the GM can ping players' });
      expect(mockCommandBus.execute).not.toHaveBeenCalled();
    });

    it('should reject ping when session is not live', async () => {
      mockSessionFinder.findById.mockResolvedValue({
        ...liveSession,
        mode: 'preparation',
      });

      const result = await gateway.handlePingPlayer(mockClient, {
        sessionId,
        campaignId,
        playerId,
      });

      expect(result).toEqual({ success: false, error: 'Session is not in live mode' });
    });

    it('should reject ping when session not found', async () => {
      mockSessionFinder.findById.mockResolvedValue(null);

      const result = await gateway.handlePingPlayer(mockClient, {
        sessionId,
        campaignId,
        playerId,
      });

      expect(result).toEqual({ success: false, error: 'Session not found' });
    });
  });

  describe('propose-action', () => {
    beforeEach(() => {
      mockClient.userId = playerId;
    });

    it('should dispatch ProposeActionCommand when player proposes', async () => {
      const result = await gateway.handleProposeAction(mockClient, {
        sessionId,
        campaignId,
        actionId,
        actionType: 'move',
        description: 'I move north',
      });

      expect(result).toEqual({ success: true });
      expect(mockCommandBus.execute).toHaveBeenCalledTimes(1);
      const command = mockCommandBus.execute.mock.calls[0][0];
      expect(command).toBeInstanceOf(ProposeActionCommand);
      expect(command.actionId).toBe(actionId);
      expect(command.playerId).toBe(playerId);
      expect(command.target).toBeNull();
    });

    it('should pass target when provided', async () => {
      await gateway.handleProposeAction(mockClient, {
        sessionId,
        campaignId,
        actionId,
        actionType: 'attack',
        description: 'I attack',
        target: 'token-1',
      });

      const command = mockCommandBus.execute.mock.calls[0][0];
      expect(command.target).toBe('token-1');
    });

    it('should reject proposal when session is not live', async () => {
      mockSessionFinder.findById.mockResolvedValue({
        ...liveSession,
        mode: 'preparation',
      });

      const result = await gateway.handleProposeAction(mockClient, {
        sessionId,
        campaignId,
        actionId,
        actionType: 'move',
        description: 'I move',
      });

      expect(result).toEqual({ success: false, error: 'Session is not in live mode' });
    });

    it('should reject proposal when session not found', async () => {
      mockSessionFinder.findById.mockResolvedValue(null);

      const result = await gateway.handleProposeAction(mockClient, {
        sessionId,
        campaignId,
        actionId,
        actionType: 'move',
        description: 'I move',
      });

      expect(result).toEqual({ success: false, error: 'Session not found' });
    });

    it('should return error when command fails', async () => {
      mockCommandBus.execute.mockRejectedValue(new Error('Validation failed'));

      const result = await gateway.handleProposeAction(mockClient, {
        sessionId,
        campaignId,
        actionId,
        actionType: 'move',
        description: 'desc',
      });

      expect(result).toEqual({ success: false, error: 'Failed to propose action' });
    });

    it('should reject proposal with invalid actionType', async () => {
      const result = await gateway.handleProposeAction(mockClient, {
        sessionId,
        campaignId,
        actionId,
        actionType: 'invalid',
        description: 'desc',
      });

      expect(result).toEqual({ success: false, error: 'Invalid actionType' });
      expect(mockCommandBus.execute).not.toHaveBeenCalled();
    });

    it('should reject proposal with description exceeding max length', async () => {
      const result = await gateway.handleProposeAction(mockClient, {
        sessionId,
        campaignId,
        actionId,
        actionType: 'move',
        description: 'x'.repeat(501),
      });

      expect(result).toEqual({ success: false, error: 'Invalid description' });
      expect(mockCommandBus.execute).not.toHaveBeenCalled();
    });

    it('should reject proposal from non-campaign-member', async () => {
      mockPrisma.campaignMember.findFirst.mockResolvedValue(null);

      const result = await gateway.handleProposeAction(mockClient, {
        sessionId,
        campaignId,
        actionId,
        actionType: 'move',
        description: 'I move north',
      });

      expect(result).toEqual({ success: false, error: 'Not a campaign member' });
      expect(mockCommandBus.execute).not.toHaveBeenCalled();
    });
  });
});
