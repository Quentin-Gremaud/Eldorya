import { SessionGateway } from '../session.gateway.js';
import { RoomManagerService } from '../services/room-manager.service.js';
import type { SessionFinder } from '../../presentation/session/finders/session.finder.js';
import type { AuthenticatedSocket } from '../types/authenticated-socket.js';

describe('SessionGateway - join-session', () => {
  let gateway: SessionGateway;
  let roomManager: RoomManagerService;
  let mockSessionFinder: { findActiveSessionByCampaign: jest.Mock; findById: jest.Mock };
  let mockClient: AuthenticatedSocket;

  const sessionId = '550e8400-e29b-41d4-a716-446655440000';
  const campaignId = '660e8400-e29b-41d4-a716-446655440001';
  const gmUserId = 'user_gm_123';
  const playerId = 'user_player_456';

  beforeEach(() => {
    roomManager = new RoomManagerService();

    mockSessionFinder = {
      findActiveSessionByCampaign: jest.fn(),
      findById: jest.fn(),
    };

    gateway = new SessionGateway(
      {} as any,
      roomManager,
      mockSessionFinder as unknown as SessionFinder,
    );

    mockClient = {
      id: 'socket-1',
      userId: playerId,
      join: jest.fn().mockResolvedValue(undefined),
      leave: jest.fn().mockResolvedValue(undefined),
    } as unknown as AuthenticatedSocket;
  });

  it('should allow GM to join session room in preparation mode', async () => {
    mockSessionFinder.findActiveSessionByCampaign.mockResolvedValue({
      id: sessionId,
      campaignId,
      gmUserId,
      mode: 'preparation',
      status: 'active',
      startedAt: '2026-03-14T10:00:00.000Z',
      endedAt: null,
    });

    mockClient.userId = gmUserId;

    const result = await gateway.handleJoinSession(mockClient, { sessionId, campaignId });

    expect(result).toEqual({ success: true });
    expect(mockClient.join).toHaveBeenCalledWith(`session:${sessionId}`);
  });

  it('should allow player to join session room in live mode', async () => {
    mockSessionFinder.findActiveSessionByCampaign.mockResolvedValue({
      id: sessionId,
      campaignId,
      gmUserId,
      mode: 'live',
      status: 'active',
      startedAt: '2026-03-14T10:00:00.000Z',
      endedAt: null,
    });

    const result = await gateway.handleJoinSession(mockClient, { sessionId, campaignId });

    expect(result).toEqual({ success: true });
    expect(mockClient.join).toHaveBeenCalledWith(`session:${sessionId}`);
  });

  it('should reject player join when session is in preparation mode', async () => {
    mockSessionFinder.findActiveSessionByCampaign.mockResolvedValue({
      id: sessionId,
      campaignId,
      gmUserId,
      mode: 'preparation',
      status: 'active',
      startedAt: '2026-03-14T10:00:00.000Z',
      endedAt: null,
    });

    const result = await gateway.handleJoinSession(mockClient, { sessionId, campaignId });

    expect(result).toEqual({ success: false, error: 'Session is not in live mode' });
    expect(mockClient.join).not.toHaveBeenCalled();
  });

  it('should reject join when no active session exists', async () => {
    mockSessionFinder.findActiveSessionByCampaign.mockResolvedValue(null);

    const result = await gateway.handleJoinSession(mockClient, { sessionId, campaignId });

    expect(result).toEqual({ success: false, error: 'Session not found or not active' });
  });

  it('should reject join when session ID does not match', async () => {
    mockSessionFinder.findActiveSessionByCampaign.mockResolvedValue({
      id: 'different-session-id',
      campaignId,
      gmUserId,
      mode: 'live',
      status: 'active',
      startedAt: '2026-03-14T10:00:00.000Z',
      endedAt: null,
    });

    const result = await gateway.handleJoinSession(mockClient, { sessionId, campaignId });

    expect(result).toEqual({ success: false, error: 'Session not found or not active' });
  });
});
