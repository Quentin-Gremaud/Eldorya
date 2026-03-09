import { InventoryNotificationSubscriber } from '../inventory-notification.subscriber.js';

describe('InventoryNotificationSubscriber', () => {
  let subscriber: InventoryNotificationSubscriber;
  let mockKurrentDb: any;
  let mockPrisma: any;
  let mockSessionGateway: any;
  let mockSocket: any;

  beforeEach(() => {
    mockSocket = {
      userId: 'player-user',
      id: 'socket-1',
      emit: jest.fn(),
    };

    mockSessionGateway = {
      server: {
        sockets: {
          sockets: new Map([['socket-1', mockSocket]]),
        },
      },
    };

    mockPrisma = {
      projectionCheckpoint: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue(undefined),
      },
      character: {
        findUnique: jest.fn().mockResolvedValue({ userId: 'player-user' }),
      },
    };

    mockKurrentDb = {
      getClient: jest.fn(),
    };

    subscriber = new InventoryNotificationSubscriber(
      mockKurrentDb,
      mockPrisma,
      mockSessionGateway,
    );
  });

  it('should be defined', () => {
    expect(subscriber).toBeTruthy();
  });

  it('should clean up on module destroy', () => {
    subscriber.onModuleDestroy();
    // Should not throw
  });

  describe('emitToUser (via private method access)', () => {
    it('should emit event to matching socket', () => {
      // Access private method for unit testing
      const emitToUser = (subscriber as any).emitToUser.bind(subscriber);

      emitToUser('player-user', 'InventoryModifiedByGM', {
        characterId: 'char-123',
        modificationType: 'add-item',
        itemId: 'item-1',
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('InventoryModifiedByGM', {
        characterId: 'char-123',
        modificationType: 'add-item',
        itemId: 'item-1',
      });
    });

    it('should not emit to non-matching socket', () => {
      const emitToUser = (subscriber as any).emitToUser.bind(subscriber);

      emitToUser('other-user', 'InventoryModifiedByGM', {
        characterId: 'char-123',
      });

      expect(mockSocket.emit).not.toHaveBeenCalled();
    });

    it('should handle missing server gracefully', () => {
      mockSessionGateway.server = null;
      const emitToUser = (subscriber as any).emitToUser.bind(subscriber);

      expect(() => {
        emitToUser('player-user', 'InventoryModifiedByGM', {});
      }).not.toThrow();
    });
  });
});
