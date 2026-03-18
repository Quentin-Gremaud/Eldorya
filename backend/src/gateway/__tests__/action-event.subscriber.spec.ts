import { ActionEventSubscriber } from '../action-event.subscriber.js';

describe('ActionEventSubscriber', () => {
  let subscriber: ActionEventSubscriber;
  let mockGateway: { server: any };
  let mockRoomManager: { findSocketsByUserId: jest.Mock; getRoomName: jest.Mock };
  let mockPrisma: {
    projectionCheckpoint: { findUnique: jest.Mock; upsert: jest.Mock };
    session: { findUnique: jest.Mock };
  };

  const sessionId = '550e8400-e29b-41d4-a716-446655440000';
  const campaignId = '660e8400-e29b-41d4-a716-446655440001';
  const playerId = 'user_player_456';
  const gmUserId = 'user_gm_123';

  let playerSocket: { emit: jest.Mock };
  let gmSocket: { emit: jest.Mock };

  beforeEach(() => {
    playerSocket = { emit: jest.fn() };
    gmSocket = { emit: jest.fn() };

    mockGateway = {
      server: {
        in: jest.fn().mockReturnValue({
          fetchSockets: jest.fn().mockResolvedValue([]),
        }),
      },
    };

    mockRoomManager = {
      findSocketsByUserId: jest.fn().mockResolvedValue([]),
      getRoomName: jest.fn().mockReturnValue(`session:${sessionId}`),
    };

    mockPrisma = {
      projectionCheckpoint: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue({}),
      },
      session: {
        findUnique: jest.fn().mockResolvedValue({ gmUserId }),
      },
    };

    subscriber = new ActionEventSubscriber(
      {} as any,
      mockPrisma as any,
      mockGateway as any,
      mockRoomManager as any,
    );
  });

  describe('handlePlayerPinged', () => {
    it('should emit PlayerPinged to targeted player and PlayerPingedGm to GM', async () => {
      mockRoomManager.findSocketsByUserId
        .mockResolvedValueOnce([playerSocket]) // player lookup
        .mockResolvedValueOnce([gmSocket]);    // gm lookup

      await (subscriber as any).handlePlayerPinged(
        { sessionId, campaignId, playerId, gmUserId },
        { timestamp: '2026-03-18T10:00:00.000Z' },
      );

      expect(mockRoomManager.findSocketsByUserId).toHaveBeenCalledWith(
        mockGateway.server, sessionId, playerId,
      );
      expect(mockRoomManager.findSocketsByUserId).toHaveBeenCalledWith(
        mockGateway.server, sessionId, gmUserId,
      );

      expect(playerSocket.emit).toHaveBeenCalledWith('PlayerPinged', expect.objectContaining({
        type: 'PlayerPinged',
        data: { sessionId, campaignId, playerId },
      }));

      expect(gmSocket.emit).toHaveBeenCalledWith('PlayerPingedGm', expect.objectContaining({
        type: 'PlayerPingedGm',
        data: { sessionId, campaignId, playerId },
      }));
    });

    it('should not emit if server is not available', async () => {
      mockGateway.server = null;

      await (subscriber as any).handlePlayerPinged(
        { sessionId, campaignId, playerId, gmUserId },
        {},
      );

      expect(mockRoomManager.findSocketsByUserId).not.toHaveBeenCalled();
    });

    it('should not emit if session not found in read model', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(null);

      await (subscriber as any).handlePlayerPinged(
        { sessionId, campaignId, playerId },
        { timestamp: '2026-03-18T10:00:00.000Z' },
      );

      expect(mockRoomManager.findSocketsByUserId).not.toHaveBeenCalled();
    });

    it('should look up gmUserId from read model, not event data', async () => {
      const readModelGmUserId = 'user_gm_from_read_model';
      mockPrisma.session.findUnique.mockResolvedValue({ gmUserId: readModelGmUserId });

      mockRoomManager.findSocketsByUserId
        .mockResolvedValueOnce([playerSocket])
        .mockResolvedValueOnce([gmSocket]);

      await (subscriber as any).handlePlayerPinged(
        { sessionId, campaignId, playerId, gmUserId: 'stale_gm_from_event' },
        { timestamp: '2026-03-18T10:00:00.000Z' },
      );

      expect(mockPrisma.session.findUnique).toHaveBeenCalledWith({
        where: { id: sessionId },
        select: { gmUserId: true },
      });
      expect(mockRoomManager.findSocketsByUserId).toHaveBeenCalledWith(
        mockGateway.server, sessionId, readModelGmUserId,
      );
    });
  });

  describe('handleActionProposed', () => {
    const actionId = '770e8400-e29b-41d4-a716-446655440002';

    it('should emit ActionProposed to GM and confirmation to player', async () => {
      mockRoomManager.findSocketsByUserId
        .mockResolvedValueOnce([gmSocket])     // gm lookup
        .mockResolvedValueOnce([playerSocket]); // player lookup

      await (subscriber as any).handleActionProposed(
        {
          actionId, sessionId, campaignId, playerId,
          actionType: 'move', description: 'I move', target: null,
          proposedAt: '2026-03-18T10:05:00.000Z',
        },
        { timestamp: '2026-03-18T10:05:00.000Z' },
      );

      expect(gmSocket.emit).toHaveBeenCalledWith('ActionProposed', expect.objectContaining({
        type: 'ActionProposed',
        data: expect.objectContaining({
          actionId,
          sessionId,
          playerId,
          actionType: 'move',
        }),
      }));

      expect(playerSocket.emit).toHaveBeenCalledWith('ActionProposedConfirmation', expect.objectContaining({
        type: 'ActionProposedConfirmation',
        data: expect.objectContaining({
          actionId,
          sessionId,
        }),
      }));
    });

    it('should not emit if session not found in read model', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(null);

      await (subscriber as any).handleActionProposed(
        { actionId, sessionId, campaignId, playerId, actionType: 'move', description: 'test', target: null, proposedAt: '2026-03-18T10:05:00.000Z' },
        {},
      );

      expect(mockRoomManager.findSocketsByUserId).not.toHaveBeenCalled();
    });
  });
});
