import { FogEventSubscriber } from './fog-event.subscriber.js';
import { SessionGateway } from './session.gateway.js';

describe('FogEventSubscriber', () => {
  let subscriber: FogEventSubscriber;
  let mockGateway: { server: { sockets: { sockets: Map<string, any> } } };
  let mockEmit: jest.Mock;

  const playerId = '660e8400-e29b-41d4-a716-446655440001';
  const otherPlayerId = '770e8400-e29b-41d4-a716-446655440099';

  beforeEach(() => {
    mockEmit = jest.fn();

    const playerSocket = {
      id: 'socket-1',
      userId: playerId,
      emit: mockEmit,
    };

    const otherSocket = {
      id: 'socket-2',
      userId: otherPlayerId,
      emit: jest.fn(),
    };

    const socketsMap = new Map<string, any>();
    socketsMap.set('socket-1', playerSocket);
    socketsMap.set('socket-2', otherSocket);

    mockGateway = {
      server: { sockets: { sockets: socketsMap } },
    };

    subscriber = new FogEventSubscriber(
      { getClient: jest.fn() } as any,
      {
        projectionCheckpoint: {
          findUnique: jest.fn().mockResolvedValue(null),
          upsert: jest.fn().mockResolvedValue(undefined),
        },
      } as any,
      mockGateway as unknown as SessionGateway,
    );
  });

  it('should emit FogZoneRevealed only to affected player socket', () => {
    // Access private method via reflection for testing targeted emission
    const emitToPlayer = (subscriber as any).emitToPlayer.bind(subscriber);

    emitToPlayer(playerId, 'FogZoneRevealed', {
      type: 'FogZoneRevealed',
      data: { fogZoneId: 'zone-1' },
    });

    expect(mockEmit).toHaveBeenCalledTimes(1);
    expect(mockEmit).toHaveBeenCalledWith('FogZoneRevealed', {
      type: 'FogZoneRevealed',
      data: { fogZoneId: 'zone-1' },
    });
  });

  it('should NOT emit to other players', () => {
    const emitToPlayer = (subscriber as any).emitToPlayer.bind(subscriber);
    const otherSocketEmit = mockGateway.server.sockets.sockets.get('socket-2')!.emit;

    emitToPlayer(playerId, 'FogZoneRevealed', {
      type: 'FogZoneRevealed',
      data: { fogZoneId: 'zone-1' },
    });

    expect(otherSocketEmit).not.toHaveBeenCalled();
  });

  it('should emit FogZoneHidden only to affected player socket', () => {
    const emitToPlayer = (subscriber as any).emitToPlayer.bind(subscriber);

    emitToPlayer(playerId, 'FogZoneHidden', {
      type: 'FogZoneHidden',
      data: { fogZoneId: 'zone-1' },
    });

    expect(mockEmit).toHaveBeenCalledWith('FogZoneHidden', {
      type: 'FogZoneHidden',
      data: { fogZoneId: 'zone-1' },
    });
  });

  it('should handle missing server gracefully', () => {
    const emptyGateway = { server: null };
    const sub = new FogEventSubscriber(
      { getClient: jest.fn() } as any,
      {
        projectionCheckpoint: {
          findUnique: jest.fn().mockResolvedValue(null),
          upsert: jest.fn().mockResolvedValue(undefined),
        },
      } as any,
      emptyGateway as unknown as SessionGateway,
    );

    expect(() => {
      (sub as any).emitToPlayer(playerId, 'FogZoneRevealed', {});
    }).not.toThrow();
  });

  it('should emit to multiple sockets of same player', () => {
    const secondEmit = jest.fn();
    mockGateway.server.sockets.sockets.set('socket-3', {
      id: 'socket-3',
      userId: playerId,
      emit: secondEmit,
    });

    const emitToPlayer = (subscriber as any).emitToPlayer.bind(subscriber);
    emitToPlayer(playerId, 'FogZoneRevealed', { data: {} });

    expect(mockEmit).toHaveBeenCalledTimes(1);
    expect(secondEmit).toHaveBeenCalledTimes(1);
  });
});
