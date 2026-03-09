import { InvitationProjection } from '../projections/invitation.projection.js';
import { KurrentDbService } from '../../../infrastructure/eventstore/kurrentdb.service.js';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';

describe('InvitationProjection', () => {
  let projection: InvitationProjection;
  let prisma: {
    invitation: { upsert: jest.Mock; updateMany: jest.Mock };
    projectionCheckpoint: { findUnique: jest.Mock; upsert: jest.Mock };
  };
  let kurrentDb: { getClient: jest.Mock };

  beforeEach(() => {
    prisma = {
      invitation: {
        upsert: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      projectionCheckpoint: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue({}),
      },
    };

    kurrentDb = {
      getClient: jest.fn(),
    };

    projection = new InvitationProjection(
      kurrentDb as unknown as KurrentDbService,
      prisma as unknown as PrismaService,
    );
  });

  describe('handleInvitationCreated', () => {
    it('should create Invitation record in read model with status active', async () => {
      const data = {
        invitationId: 'inv-123',
        tokenHash: 'hash-abc',
        campaignId: 'campaign-456',
        createdByUserId: 'user-gm-1',
        expiresAt: '2026-03-08T12:00:00.000Z',
      };

      await projection.handleInvitationCreated(data);

      expect(prisma.invitation.upsert).toHaveBeenCalledWith({
        where: { id: 'inv-123' },
        create: {
          id: 'inv-123',
          tokenHash: 'hash-abc',
          campaignId: 'campaign-456',
          createdByUserId: 'user-gm-1',
          status: 'active',
          expiresAt: new Date('2026-03-08T12:00:00.000Z'),
        },
        update: {
          tokenHash: 'hash-abc',
          campaignId: 'campaign-456',
          createdByUserId: 'user-gm-1',
          status: 'active',
          expiresAt: new Date('2026-03-08T12:00:00.000Z'),
        },
      });
    });

    it('should handle null expiresAt', async () => {
      const data = {
        invitationId: 'inv-123',
        tokenHash: 'hash-abc',
        campaignId: 'campaign-456',
        createdByUserId: 'user-gm-1',
        expiresAt: null,
      };

      await projection.handleInvitationCreated(data);

      const call = prisma.invitation.upsert.mock.calls[0][0];
      expect(call.create.expiresAt).toBeNull();
    });
  });

  describe('handleInvitationAccepted', () => {
    it('should update Invitation record to used status', async () => {
      const data = {
        invitationId: 'inv-123',
        campaignId: 'campaign-456',
        acceptedByUserId: 'user-player-1',
        acceptedAt: '2026-03-05T14:00:00.000Z',
      };

      await projection.handleInvitationAccepted(data);

      expect(prisma.invitation.updateMany).toHaveBeenCalledWith({
        where: { id: 'inv-123' },
        data: {
          status: 'used',
          usedByUserId: 'user-player-1',
          usedAt: new Date('2026-03-05T14:00:00.000Z'),
        },
      });
    });
  });

  describe('handleInvitationRevoked', () => {
    it('should update Invitation record to revoked status', async () => {
      const data = {
        invitationId: 'inv-123',
        campaignId: 'campaign-456',
        revokedByUserId: 'user-gm-1',
        revokedAt: '2026-03-05T14:00:00.000Z',
      };

      await projection.handleInvitationRevoked(data);

      expect(prisma.invitation.updateMany).toHaveBeenCalledWith({
        where: { id: 'inv-123' },
        data: {
          status: 'revoked',
        },
      });
    });
  });

  describe('Subscription lifecycle', () => {
    /**
     * Helper: creates an async iterable that yields the given events
     * and then completes (returns).
     */
    function createMockSubscription(
      events: Array<{ event: Record<string, unknown> | undefined }> = [],
    ): AsyncIterable<{ event: Record<string, unknown> | undefined }> {
      return {
        [Symbol.asyncIterator]() {
          let index = 0;
          return {
            async next() {
              if (index < events.length) {
                return { value: events[index++], done: false };
              }
              return { value: undefined, done: true as const };
            },
          };
        },
      };
    }

    it('onModuleInit should call startSubscription (subscribes to KurrentDB)', async () => {
      const mockSubscription = createMockSubscription();
      const subscribeToAll = jest.fn().mockReturnValue(mockSubscription);
      kurrentDb.getClient.mockReturnValue({ subscribeToAll });

      await projection.onModuleInit();

      expect(kurrentDb.getClient).toHaveBeenCalled();
      expect(subscribeToAll).toHaveBeenCalledWith(
        expect.objectContaining({
          fromPosition: expect.anything(),
          filter: expect.anything(),
        }),
      );
    });

    it('onModuleDestroy should abort the subscription via AbortController', async () => {
      // Start subscription so that abortController is set
      const mockSubscription = createMockSubscription();
      const subscribeToAll = jest.fn().mockReturnValue(mockSubscription);
      kurrentDb.getClient.mockReturnValue({ subscribeToAll });

      await projection.onModuleInit();

      // Access the private abortController to verify it gets aborted
      const abortController = (projection as any)
        .abortController as AbortController;
      expect(abortController).toBeDefined();
      expect(abortController.signal.aborted).toBe(false);

      projection.onModuleDestroy();

      expect(abortController.signal.aborted).toBe(true);
    });

    it('should schedule reconnection after 5s when subscription throws an error', async () => {
      jest.useFakeTimers();

      const subscriptionError = new Error('Connection lost');
      const subscribeToAll = jest.fn().mockImplementation(() => {
        throw subscriptionError;
      });
      kurrentDb.getClient.mockReturnValue({ subscribeToAll });

      // First call: subscription throws, schedules retry
      await projection.onModuleInit();

      // After error, a setTimeout(5000) should be pending
      expect(subscribeToAll).toHaveBeenCalledTimes(1);

      // Now make subscribe work on retry
      const mockSubscription = createMockSubscription();
      subscribeToAll.mockReturnValue(mockSubscription);

      // Advance timers by 5s to trigger the retry
      jest.advanceTimersByTime(5000);

      // The retry is scheduled via setTimeout, give the micro-task queue
      // a tick to allow the async startSubscription to execute
      await Promise.resolve();

      expect(subscribeToAll).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
    });
  });
});
