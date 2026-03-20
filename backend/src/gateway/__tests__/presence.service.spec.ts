import { PresenceService, type PresenceChange } from '../services/presence.service.js';
import type { Clock } from '../../shared/clock.js';

describe('PresenceService', () => {
  let service: PresenceService;
  let clock: { now: jest.Mock };
  let changes: PresenceChange[];

  const sessionId = '550e8400-e29b-41d4-a716-446655440000';
  const userId1 = 'user_player_1';
  const userId2 = 'user_player_2';
  const socketId1 = 'socket-1';
  const socketId2 = 'socket-2';
  const socketId3 = 'socket-3';

  beforeEach(() => {
    clock = { now: jest.fn().mockReturnValue(new Date('2026-03-19T10:00:00Z')) };
    service = new PresenceService(clock as Clock);
    changes = [];
    service.onPresenceChange((change) => changes.push(change));
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  describe('playerConnected', () => {
    it('should mark new player as online and emit change', () => {
      const result = service.playerConnected(sessionId, userId1, socketId1);

      expect(result).toEqual({
        sessionId,
        userId: userId1,
        status: 'online',
      });
      expect(changes).toHaveLength(1);
      expect(changes[0]).toEqual({
        sessionId,
        userId: userId1,
        status: 'online',
      });
    });

    it('should not emit change when user connects with additional socket while already online', () => {
      service.playerConnected(sessionId, userId1, socketId1);
      changes.length = 0;

      const result = service.playerConnected(sessionId, userId1, socketId2);

      expect(result).toBeNull();
      expect(changes).toHaveLength(0);
    });

    it('should emit online change when reconnecting after disconnect', () => {
      service.playerConnected(sessionId, userId1, socketId1);
      service.playerDisconnected(socketId1);
      changes.length = 0;

      const result = service.playerConnected(sessionId, userId1, socketId2);

      expect(result).toEqual({
        sessionId,
        userId: userId1,
        status: 'online',
      });
      expect(changes).toHaveLength(1);
    });

    it('should track multiple users independently', () => {
      service.playerConnected(sessionId, userId1, socketId1);
      service.playerConnected(sessionId, userId2, socketId2);

      expect(changes).toHaveLength(2);
      const presences = service.getPresences(sessionId);
      expect(presences).toHaveLength(2);
      expect(presences).toEqual(
        expect.arrayContaining([
          { userId: userId1, sessionId, status: 'online' },
          { userId: userId2, sessionId, status: 'online' },
        ]),
      );
    });
  });

  describe('playerDisconnected', () => {
    it('should mark player as disconnected when last socket disconnects', () => {
      service.playerConnected(sessionId, userId1, socketId1);
      changes.length = 0;

      const result = service.playerDisconnected(socketId1);

      expect(result).toEqual({
        sessionId,
        userId: userId1,
        status: 'disconnected',
      });
      expect(changes).toHaveLength(1);
    });

    it('should not change status when user still has other sockets', () => {
      service.playerConnected(sessionId, userId1, socketId1);
      service.playerConnected(sessionId, userId1, socketId2);
      changes.length = 0;

      const result = service.playerDisconnected(socketId1);

      expect(result).toBeNull();
      expect(changes).toHaveLength(0);
      const presences = service.getPresences(sessionId);
      expect(presences[0].status).toBe('online');
    });

    it('should return null for unknown socket', () => {
      const result = service.playerDisconnected('unknown-socket');
      expect(result).toBeNull();
    });
  });

  describe('recordActivity', () => {
    it('should reset idle status to online', () => {
      service.playerConnected(sessionId, userId1, socketId1);

      // Advance time past idle threshold
      clock.now.mockReturnValue(new Date('2026-03-19T10:06:00Z'));
      service.checkIdle();
      changes.length = 0;

      // Record activity should reset to online
      service.recordActivity(socketId1);

      expect(changes).toHaveLength(1);
      expect(changes[0]).toEqual({
        sessionId,
        userId: userId1,
        status: 'online',
      });
    });

    it('should not emit change when already online', () => {
      service.playerConnected(sessionId, userId1, socketId1);
      changes.length = 0;

      service.recordActivity(socketId1);

      expect(changes).toHaveLength(0);
    });

    it('should ignore unknown socket', () => {
      service.recordActivity('unknown-socket');
      expect(changes).toHaveLength(0);
    });
  });

  describe('checkIdle', () => {
    it('should mark player as idle after 5 minutes of inactivity', () => {
      service.playerConnected(sessionId, userId1, socketId1);
      changes.length = 0;

      // Advance time by 5 minutes + 1 second
      clock.now.mockReturnValue(new Date('2026-03-19T10:05:01Z'));
      const idleChanges = service.checkIdle();

      expect(idleChanges).toHaveLength(1);
      expect(idleChanges[0]).toEqual({
        sessionId,
        userId: userId1,
        status: 'idle',
      });
      expect(changes).toHaveLength(1);
    });

    it('should not mark player as idle before 5 minutes', () => {
      service.playerConnected(sessionId, userId1, socketId1);
      changes.length = 0;

      // Advance time by only 4 minutes
      clock.now.mockReturnValue(new Date('2026-03-19T10:04:00Z'));
      const idleChanges = service.checkIdle();

      expect(idleChanges).toHaveLength(0);
      expect(changes).toHaveLength(0);
    });

    it('should not re-idle an already idle player', () => {
      service.playerConnected(sessionId, userId1, socketId1);
      clock.now.mockReturnValue(new Date('2026-03-19T10:06:00Z'));
      service.checkIdle();
      changes.length = 0;

      // Check again — should not emit duplicate
      const idleChanges = service.checkIdle();

      expect(idleChanges).toHaveLength(0);
      expect(changes).toHaveLength(0);
    });

    it('should not idle disconnected players', () => {
      service.playerConnected(sessionId, userId1, socketId1);
      service.playerDisconnected(socketId1);
      changes.length = 0;

      clock.now.mockReturnValue(new Date('2026-03-19T10:06:00Z'));
      const idleChanges = service.checkIdle();

      expect(idleChanges).toHaveLength(0);
    });

    it('should handle activity reset preventing idle', () => {
      service.playerConnected(sessionId, userId1, socketId1);

      // Advance to 4 minutes
      clock.now.mockReturnValue(new Date('2026-03-19T10:04:00Z'));
      service.recordActivity(socketId1);

      // Advance to 8 minutes from start (4 min from last activity)
      clock.now.mockReturnValue(new Date('2026-03-19T10:08:00Z'));
      changes.length = 0;
      const idleChanges = service.checkIdle();

      expect(idleChanges).toHaveLength(0);
    });

    it('should idle player after 5 minutes from last activity', () => {
      service.playerConnected(sessionId, userId1, socketId1);

      // Activity at 4 minutes
      clock.now.mockReturnValue(new Date('2026-03-19T10:04:00Z'));
      service.recordActivity(socketId1);

      // 5 min + 1 second after last activity (9:01 from start)
      clock.now.mockReturnValue(new Date('2026-03-19T10:09:01Z'));
      changes.length = 0;
      const idleChanges = service.checkIdle();

      expect(idleChanges).toHaveLength(1);
      expect(idleChanges[0].status).toBe('idle');
    });
  });

  describe('getPresences', () => {
    it('should return empty array for unknown session', () => {
      expect(service.getPresences('unknown-session')).toEqual([]);
    });

    it('should return all player presences for a session', () => {
      service.playerConnected(sessionId, userId1, socketId1);
      service.playerConnected(sessionId, userId2, socketId2);

      const presences = service.getPresences(sessionId);

      expect(presences).toHaveLength(2);
      expect(presences).toEqual(
        expect.arrayContaining([
          { userId: userId1, sessionId, status: 'online' },
          { userId: userId2, sessionId, status: 'online' },
        ]),
      );
    });

    it('should reflect current status (online, idle, disconnected)', () => {
      service.playerConnected(sessionId, userId1, socketId1);
      service.playerConnected(sessionId, userId2, socketId2);

      // Make user1 idle
      clock.now.mockReturnValue(new Date('2026-03-19T10:06:00Z'));
      service.recordActivity(socketId2); // keep user2 active
      service.checkIdle();

      // Disconnect user2
      service.playerDisconnected(socketId2);

      const presences = service.getPresences(sessionId);
      const user1 = presences.find((p) => p.userId === userId1);
      const user2 = presences.find((p) => p.userId === userId2);

      expect(user1?.status).toBe('idle');
      expect(user2?.status).toBe('disconnected');
    });
  });

  describe('clearSession', () => {
    it('should remove all presence data for a session', () => {
      service.playerConnected(sessionId, userId1, socketId1);
      service.playerConnected(sessionId, userId2, socketId2);

      service.clearSession(sessionId);

      expect(service.getPresences(sessionId)).toEqual([]);
    });
  });
});
