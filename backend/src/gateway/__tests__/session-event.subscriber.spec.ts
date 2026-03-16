import { SessionEventSubscriber } from '../session-event.subscriber.js';
import { RoomManagerService } from '../services/room-manager.service.js';

describe('SessionEventSubscriber', () => {
  let subscriber: SessionEventSubscriber;
  let roomManager: RoomManagerService;
  let mockKurrentDb: any;
  let mockPrisma: any;
  let mockGateway: any;
  let mockToEmit: jest.Mock;
  let mockSubscription: any[];
  let resolveSubscription: () => void;

  const sessionId = '550e8400-e29b-41d4-a716-446655440000';
  const campaignId = '660e8400-e29b-41d4-a716-446655440001';
  const timestamp = '2026-03-15T10:00:00.000Z';

  function createResolvedEvent(
    type: string,
    data: Record<string, unknown>,
    metadata?: Record<string, unknown>,
    position?: { commit: bigint; prepare: bigint },
  ) {
    return {
      event: {
        id: `event-${Math.random().toString(36).slice(2)}`,
        type,
        data,
        metadata,
        position: position ?? { commit: 100n, prepare: 100n },
      },
    };
  }

  function createAsyncIterableFromEvents(events: any[]) {
    let index = 0;
    return {
      [Symbol.asyncIterator]() {
        return {
          next: async () => {
            if (index < events.length) {
              return { value: events[index++], done: false };
            }
            return { value: undefined, done: true };
          },
        };
      },
    };
  }

  beforeEach(() => {
    mockSubscription = [];

    roomManager = new RoomManagerService();

    mockToEmit = jest.fn();
    mockGateway = {
      server: {
        to: jest.fn().mockReturnValue({ emit: mockToEmit }),
      },
    };

    mockPrisma = {
      projectionCheckpoint: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue(undefined),
      },
    };

    mockKurrentDb = {
      getClient: jest.fn().mockReturnValue({
        subscribeToAll: jest.fn().mockReturnValue(
          createAsyncIterableFromEvents(mockSubscription),
        ),
      }),
    };
  });

  function createSubscriber() {
    return new SessionEventSubscriber(
      mockKurrentDb,
      mockPrisma,
      mockGateway as any,
      roomManager,
    );
  }

  function setupSubscriptionWithEvents(events: any[]) {
    mockKurrentDb.getClient.mockReturnValue({
      subscribeToAll: jest.fn().mockReturnValue(
        createAsyncIterableFromEvents(events),
      ),
    });
  }

  async function startSubscriptionAndWait(sub: SessionEventSubscriber) {
    // Access private method to trigger subscription processing
    await (sub as any).startSubscription();
  }

  describe('RoomManagerService room name format', () => {
    it('should return room name in session:{sessionId} format', () => {
      expect(roomManager.getRoomName(sessionId)).toBe(`session:${sessionId}`);
    });

    it('should return different room names for different session IDs', () => {
      const otherSessionId = '770e8400-e29b-41d4-a716-446655440002';
      expect(roomManager.getRoomName(sessionId)).not.toBe(
        roomManager.getRoomName(otherSessionId),
      );
    });
  });

  describe('lifecycle', () => {
    it('should be defined', () => {
      const sub = createSubscriber();
      expect(sub).toBeTruthy();
    });

    it('should clean up on module destroy without throwing', () => {
      const sub = createSubscriber();
      expect(() => sub.onModuleDestroy()).not.toThrow();
    });

    it('should abort subscription on module destroy after init', async () => {
      setupSubscriptionWithEvents([]);
      const sub = createSubscriber();
      await startSubscriptionAndWait(sub);
      expect(() => sub.onModuleDestroy()).not.toThrow();
    });
  });

  describe('SessionModeChanged → live', () => {
    it('should emit SessionModeLive to correct room when newMode is live', async () => {
      const event = createResolvedEvent(
        'SessionModeChanged',
        { sessionId, campaignId, newMode: 'live' },
        { timestamp },
      );
      setupSubscriptionWithEvents([event]);

      const sub = createSubscriber();
      await startSubscriptionAndWait(sub);

      const expectedRoom = `session:${sessionId}`;
      expect(mockGateway.server.to).toHaveBeenCalledWith(expectedRoom);
      expect(mockToEmit).toHaveBeenCalledWith('SessionModeLive', {
        type: 'SessionModeLive',
        data: { sessionId, campaignId, mode: 'live' },
        metadata: { campaignId, timestamp },
      });
    });

    it('should include correct payload structure for live mode', async () => {
      const event = createResolvedEvent(
        'SessionModeChanged',
        { sessionId, campaignId, newMode: 'live' },
        { timestamp },
      );
      setupSubscriptionWithEvents([event]);

      const sub = createSubscriber();
      await startSubscriptionAndWait(sub);

      const emittedPayload = mockToEmit.mock.calls[0][1];
      expect(emittedPayload).toEqual({
        type: 'SessionModeLive',
        data: {
          sessionId,
          campaignId,
          mode: 'live',
        },
        metadata: {
          campaignId,
          timestamp,
        },
      });
    });
  });

  describe('SessionModeChanged → preparation', () => {
    it('should emit SessionModePreparation to correct room when newMode is preparation', async () => {
      const event = createResolvedEvent(
        'SessionModeChanged',
        { sessionId, campaignId, newMode: 'preparation' },
        { timestamp },
      );
      setupSubscriptionWithEvents([event]);

      const sub = createSubscriber();
      await startSubscriptionAndWait(sub);

      const expectedRoom = `session:${sessionId}`;
      expect(mockGateway.server.to).toHaveBeenCalledWith(expectedRoom);
      expect(mockToEmit).toHaveBeenCalledWith('SessionModePreparation', {
        type: 'SessionModePreparation',
        data: { sessionId, campaignId, mode: 'preparation' },
        metadata: { campaignId, timestamp },
      });
    });

    it('should include correct payload structure for preparation mode', async () => {
      const event = createResolvedEvent(
        'SessionModeChanged',
        { sessionId, campaignId, newMode: 'preparation' },
        { timestamp },
      );
      setupSubscriptionWithEvents([event]);

      const sub = createSubscriber();
      await startSubscriptionAndWait(sub);

      const emittedPayload = mockToEmit.mock.calls[0][1];
      expect(emittedPayload).toEqual({
        type: 'SessionModePreparation',
        data: {
          sessionId,
          campaignId,
          mode: 'preparation',
        },
        metadata: {
          campaignId,
          timestamp,
        },
      });
    });
  });

  describe('non-matching event types', () => {
    it('should NOT emit when event type is SessionStarted', async () => {
      const event = createResolvedEvent(
        'SessionStarted',
        { sessionId, campaignId, gmUserId: 'gm-user' },
        { timestamp },
      );
      setupSubscriptionWithEvents([event]);

      const sub = createSubscriber();
      await startSubscriptionAndWait(sub);

      expect(mockGateway.server.to).not.toHaveBeenCalled();
      expect(mockToEmit).not.toHaveBeenCalled();
    });

    it('should NOT emit when event type is SessionEnded', async () => {
      const event = createResolvedEvent(
        'SessionEnded',
        { sessionId, campaignId },
        { timestamp },
      );
      setupSubscriptionWithEvents([event]);

      const sub = createSubscriber();
      await startSubscriptionAndWait(sub);

      expect(mockGateway.server.to).not.toHaveBeenCalled();
      expect(mockToEmit).not.toHaveBeenCalled();
    });

    it('should only emit for SessionModeChanged among mixed events', async () => {
      const events = [
        createResolvedEvent('SessionStarted', { sessionId, campaignId }),
        createResolvedEvent('SessionModeChanged', {
          sessionId,
          campaignId,
          newMode: 'live',
        }, { timestamp }),
        createResolvedEvent('SessionEnded', { sessionId, campaignId }),
      ];
      setupSubscriptionWithEvents(events);

      const sub = createSubscriber();
      await startSubscriptionAndWait(sub);

      expect(mockGateway.server.to).toHaveBeenCalledTimes(1);
      expect(mockToEmit).toHaveBeenCalledTimes(1);
      expect(mockToEmit).toHaveBeenCalledWith('SessionModeLive', expect.any(Object));
    });
  });

  describe('server null/undefined handling', () => {
    it('should NOT throw when server is null', async () => {
      mockGateway.server = null;

      const event = createResolvedEvent(
        'SessionModeChanged',
        { sessionId, campaignId, newMode: 'live' },
        { timestamp },
      );
      setupSubscriptionWithEvents([event]);

      const sub = createSubscriber();
      await expect(startSubscriptionAndWait(sub)).resolves.not.toThrow();
      expect(mockToEmit).not.toHaveBeenCalled();
    });

    it('should NOT throw when server is undefined', async () => {
      mockGateway.server = undefined;

      const event = createResolvedEvent(
        'SessionModeChanged',
        { sessionId, campaignId, newMode: 'preparation' },
        { timestamp },
      );
      setupSubscriptionWithEvents([event]);

      const sub = createSubscriber();
      await expect(startSubscriptionAndWait(sub)).resolves.not.toThrow();
      expect(mockToEmit).not.toHaveBeenCalled();
    });
  });

  describe('checkpoint persistence', () => {
    it('should upsert checkpoint after processing an event', async () => {
      const event = createResolvedEvent(
        'SessionModeChanged',
        { sessionId, campaignId, newMode: 'live' },
        { timestamp },
        { commit: 200n, prepare: 201n },
      );
      setupSubscriptionWithEvents([event]);

      const sub = createSubscriber();
      await startSubscriptionAndWait(sub);

      expect(mockPrisma.projectionCheckpoint.upsert).toHaveBeenCalledWith({
        where: { projectionName: 'SessionEventSubscriber' },
        create: {
          projectionName: 'SessionEventSubscriber',
          commitPosition: '200',
          preparePosition: '201',
        },
        update: {
          commitPosition: '200',
          preparePosition: '201',
        },
      });
    });

    it('should upsert checkpoint even for non-matching event types', async () => {
      const event = createResolvedEvent(
        'SessionStarted',
        { sessionId, campaignId },
        { timestamp },
        { commit: 50n, prepare: 51n },
      );
      setupSubscriptionWithEvents([event]);

      const sub = createSubscriber();
      await startSubscriptionAndWait(sub);

      expect(mockPrisma.projectionCheckpoint.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { projectionName: 'SessionEventSubscriber' },
          update: { commitPosition: '50', preparePosition: '51' },
        }),
      );
    });

    it('should resume from existing checkpoint position', async () => {
      mockPrisma.projectionCheckpoint.findUnique.mockResolvedValue({
        projectionName: 'SessionEventSubscriber',
        commitPosition: '300',
        preparePosition: '301',
      });
      setupSubscriptionWithEvents([]);

      const sub = createSubscriber();
      await startSubscriptionAndWait(sub);

      const client = mockKurrentDb.getClient();
      expect(client.subscribeToAll).toHaveBeenCalledWith(
        expect.objectContaining({
          fromPosition: { commit: 300n, prepare: 301n },
        }),
      );
    });

    it('should start from START when no checkpoint exists', async () => {
      mockPrisma.projectionCheckpoint.findUnique.mockResolvedValue(null);
      setupSubscriptionWithEvents([]);

      const sub = createSubscriber();
      await startSubscriptionAndWait(sub);

      const client = mockKurrentDb.getClient();
      expect(client.subscribeToAll).toHaveBeenCalledWith(
        expect.objectContaining({
          fromPosition: 'start',
        }),
      );
    });
  });

  describe('metadata handling', () => {
    it('should pass undefined timestamp when metadata is missing', async () => {
      const event = createResolvedEvent(
        'SessionModeChanged',
        { sessionId, campaignId, newMode: 'live' },
        undefined,
      );
      setupSubscriptionWithEvents([event]);

      const sub = createSubscriber();
      await startSubscriptionAndWait(sub);

      expect(mockToEmit).toHaveBeenCalledWith('SessionModeLive', {
        type: 'SessionModeLive',
        data: { sessionId, campaignId, mode: 'live' },
        metadata: { campaignId, timestamp: undefined },
      });
    });
  });

  describe('events without resolvedEvent.event', () => {
    it('should skip events where event is null', async () => {
      const events = [
        { event: null },
        createResolvedEvent(
          'SessionModeChanged',
          { sessionId, campaignId, newMode: 'live' },
          { timestamp },
        ),
      ];
      setupSubscriptionWithEvents(events);

      const sub = createSubscriber();
      await startSubscriptionAndWait(sub);

      expect(mockToEmit).toHaveBeenCalledTimes(1);
      expect(mockToEmit).toHaveBeenCalledWith('SessionModeLive', expect.any(Object));
    });
  });

  describe('unknown newMode value', () => {
    it('should NOT emit for unrecognized mode values', async () => {
      const event = createResolvedEvent(
        'SessionModeChanged',
        { sessionId, campaignId, newMode: 'unknown-mode' },
        { timestamp },
      );
      setupSubscriptionWithEvents([event]);

      const sub = createSubscriber();
      await startSubscriptionAndWait(sub);

      expect(mockGateway.server.to).not.toHaveBeenCalled();
      expect(mockToEmit).not.toHaveBeenCalled();
    });
  });
});
