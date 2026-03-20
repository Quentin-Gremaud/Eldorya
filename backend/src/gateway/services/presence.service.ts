import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { CLOCK, type Clock } from '../../shared/clock.js';

export type PresenceStatus = 'online' | 'idle' | 'disconnected';

export interface PlayerPresence {
  userId: string;
  sessionId: string;
  status: PresenceStatus;
}

export interface PresenceChange {
  sessionId: string;
  userId: string;
  status: PresenceStatus;
}

interface PresenceEntry {
  status: PresenceStatus;
  lastActivity: Date;
  socketCount: number;
}

const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const IDLE_CHECK_INTERVAL_MS = 30 * 1000; // 30 seconds

@Injectable()
export class PresenceService implements OnModuleDestroy {
  private readonly logger = new Logger(PresenceService.name);

  /** sessionId → Map<userId, PresenceEntry> */
  private readonly sessions = new Map<string, Map<string, PresenceEntry>>();

  /** socketId → { sessionId, userId } for reverse lookup on disconnect */
  private readonly socketSessions = new Map<
    string,
    { sessionId: string; userId: string }
  >();

  private idleCheckInterval: ReturnType<typeof setInterval> | null = null;

  private readonly changeListeners: Array<(change: PresenceChange) => void> = [];

  constructor(@Inject(CLOCK) private readonly clock: Clock) {}

  start(): void {
    this.idleCheckInterval = setInterval(
      () => this.checkIdle(),
      IDLE_CHECK_INTERVAL_MS,
    );
    this.logger.log('Presence idle detection started (30s interval)');
  }

  onModuleDestroy(): void {
    if (this.idleCheckInterval) {
      clearInterval(this.idleCheckInterval);
      this.idleCheckInterval = null;
    }
  }

  onPresenceChange(listener: (change: PresenceChange) => void): void {
    this.changeListeners.push(listener);
  }

  playerConnected(
    sessionId: string,
    userId: string,
    socketId: string,
  ): PresenceChange | null {
    this.socketSessions.set(socketId, { sessionId, userId });

    let sessionMap = this.sessions.get(sessionId);
    if (!sessionMap) {
      sessionMap = new Map();
      this.sessions.set(sessionId, sessionMap);
    }

    const existing = sessionMap.get(userId);
    if (existing) {
      // User already has sockets in this session — increment count, ensure online
      existing.socketCount++;
      existing.lastActivity = this.clock.now();
      if (existing.status !== 'online') {
        existing.status = 'online';
        const change: PresenceChange = { sessionId, userId, status: 'online' };
        this.notifyChange(change);
        return change;
      }
      return null; // Already online, no status change
    }

    // New user in session
    sessionMap.set(userId, {
      status: 'online',
      lastActivity: this.clock.now(),
      socketCount: 1,
    });

    const change: PresenceChange = { sessionId, userId, status: 'online' };
    this.notifyChange(change);
    return change;
  }

  playerDisconnected(socketId: string): PresenceChange | null {
    const mapping = this.socketSessions.get(socketId);
    if (!mapping) return null;

    this.socketSessions.delete(socketId);
    const { sessionId, userId } = mapping;

    const sessionMap = this.sessions.get(sessionId);
    if (!sessionMap) return null;

    const entry = sessionMap.get(userId);
    if (!entry) return null;

    entry.socketCount--;
    if (entry.socketCount <= 0) {
      // Last socket disconnected → mark disconnected
      entry.status = 'disconnected';
      entry.socketCount = 0;
      const change: PresenceChange = {
        sessionId,
        userId,
        status: 'disconnected',
      };
      this.notifyChange(change);
      return change;
    }

    // Still has other sockets, no status change
    return null;
  }

  recordActivity(socketId: string): void {
    const mapping = this.socketSessions.get(socketId);
    if (!mapping) return;

    const { sessionId, userId } = mapping;
    const sessionMap = this.sessions.get(sessionId);
    if (!sessionMap) return;

    const entry = sessionMap.get(userId);
    if (!entry) return;

    entry.lastActivity = this.clock.now();

    if (entry.status === 'idle') {
      entry.status = 'online';
      const change: PresenceChange = { sessionId, userId, status: 'online' };
      this.notifyChange(change);
    }
  }

  getPresences(sessionId: string): PlayerPresence[] {
    const sessionMap = this.sessions.get(sessionId);
    if (!sessionMap) return [];

    const presences: PlayerPresence[] = [];
    for (const [userId, entry] of sessionMap) {
      presences.push({
        userId,
        sessionId,
        status: entry.status,
      });
    }
    return presences;
  }

  checkIdle(): PresenceChange[] {
    const now = this.clock.now();
    const changes: PresenceChange[] = [];

    for (const [sessionId, sessionMap] of this.sessions) {
      for (const [userId, entry] of sessionMap) {
        if (
          entry.status === 'online' &&
          now.getTime() - entry.lastActivity.getTime() > IDLE_TIMEOUT_MS
        ) {
          entry.status = 'idle';
          const change: PresenceChange = { sessionId, userId, status: 'idle' };
          changes.push(change);
          this.notifyChange(change);
        }
      }
    }

    return changes;
  }

  clearSession(sessionId: string): void {
    const sessionMap = this.sessions.get(sessionId);
    if (!sessionMap) return;

    // Clean up socket mappings for this session
    const socketIdsToRemove: string[] = [];
    for (const [socketId, mapping] of this.socketSessions) {
      if (mapping.sessionId === sessionId) {
        socketIdsToRemove.push(socketId);
      }
    }
    for (const socketId of socketIdsToRemove) {
      this.socketSessions.delete(socketId);
    }

    this.sessions.delete(sessionId);
  }

  private notifyChange(change: PresenceChange): void {
    this.logger.log(
      `Presence changed: user ${change.userId} → ${change.status} in session ${change.sessionId}`,
    );
    for (const listener of this.changeListeners) {
      listener(change);
    }
  }
}
