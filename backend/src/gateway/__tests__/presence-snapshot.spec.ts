import { SessionGateway } from '../session.gateway.js';
import { RoomManagerService } from '../services/room-manager.service.js';
import type { SessionFinder } from '../../presentation/session/finders/session.finder.js';
import type { AuthenticatedSocket } from '../types/authenticated-socket.js';

describe('SessionGateway - presence snapshot', () => {
  let gateway: SessionGateway;
  let roomManager: RoomManagerService;
  let mockPresenceService: {
    recordActivity: jest.Mock;
    playerConnected: jest.Mock;
    playerDisconnected: jest.Mock;
    getPresences: jest.Mock;
  };
  let mockSessionFinder: { findActiveSessionByCampaign: jest.Mock; findById: jest.Mock };
  let mockPrisma: { campaignMember: { findFirst: jest.Mock } };

  const sessionId = '550e8400-e29b-41d4-a716-446655440000';
  const campaignId = '660e8400-e29b-41d4-a716-446655440001';
  const gmUserId = 'user_gm_123';
  const playerId = 'user_player_456';

  const liveSession = {
    id: sessionId,
    campaignId,
    gmUserId,
    mode: 'live',
    status: 'active',
    startedAt: '2026-03-19T10:00:00.000Z',
    endedAt: null,
  };

  beforeEach(() => {
    roomManager = new RoomManagerService();
    mockPresenceService = {
      recordActivity: jest.fn(),
      playerConnected: jest.fn(),
      playerDisconnected: jest.fn(),
      getPresences: jest.fn(),
    };
    mockSessionFinder = {
      findActiveSessionByCampaign: jest.fn(),
      findById: jest.fn(),
    };
    mockPrisma = {
      campaignMember: {
        findFirst: jest.fn().mockResolvedValue({ id: 'member-1' }),
      },
    };

    gateway = new SessionGateway(
      {} as any,
      roomManager,
      mockPresenceService as any,
      mockSessionFinder as unknown as SessionFinder,
      { execute: jest.fn() } as any,
      mockPrisma as any,
    );
  });

  it('should send PresenceSnapshot to GM on join', async () => {
    mockSessionFinder.findActiveSessionByCampaign.mockResolvedValue(liveSession);
    mockPresenceService.getPresences.mockReturnValue([
      { userId: playerId, sessionId, status: 'online' },
    ]);

    const gmClient = {
      id: 'socket-gm',
      userId: gmUserId,
      join: jest.fn().mockResolvedValue(undefined),
      emit: jest.fn(),
    } as unknown as AuthenticatedSocket;

    await gateway.handleJoinSession(gmClient, { sessionId, campaignId });

    expect(gmClient.emit).toHaveBeenCalledWith('PresenceSnapshot', {
      type: 'PresenceSnapshot',
      data: {
        sessionId,
        presences: [{ userId: playerId, sessionId, status: 'online' }],
      },
    });
  });

  it('should not send PresenceSnapshot to non-GM player', async () => {
    mockSessionFinder.findActiveSessionByCampaign.mockResolvedValue(liveSession);

    const playerClient = {
      id: 'socket-player',
      userId: playerId,
      join: jest.fn().mockResolvedValue(undefined),
      emit: jest.fn(),
    } as unknown as AuthenticatedSocket;

    await gateway.handleJoinSession(playerClient, { sessionId, campaignId });

    expect(playerClient.emit).not.toHaveBeenCalledWith(
      'PresenceSnapshot',
      expect.anything(),
    );
  });

  it('should include all current presences in snapshot including GM', async () => {
    const player2Id = 'user_player_789';
    mockSessionFinder.findActiveSessionByCampaign.mockResolvedValue(liveSession);
    mockPresenceService.getPresences.mockReturnValue([
      { userId: gmUserId, sessionId, status: 'online' },
      { userId: playerId, sessionId, status: 'online' },
      { userId: player2Id, sessionId, status: 'idle' },
    ]);

    const gmClient = {
      id: 'socket-gm',
      userId: gmUserId,
      join: jest.fn().mockResolvedValue(undefined),
      emit: jest.fn(),
    } as unknown as AuthenticatedSocket;

    await gateway.handleJoinSession(gmClient, { sessionId, campaignId });

    const snapshot = (gmClient.emit as jest.Mock).mock.calls[0][1];
    expect(snapshot.data.presences).toHaveLength(3);
  });
});
