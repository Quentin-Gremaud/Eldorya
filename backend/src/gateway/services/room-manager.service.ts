import { Injectable, Logger } from '@nestjs/common';
import type { Server } from 'socket.io';
import type { AuthenticatedSocket } from '../types/authenticated-socket.js';

@Injectable()
export class RoomManagerService {
  private readonly logger = new Logger(RoomManagerService.name);

  /**
   * Internal map: `${sessionId}:${userId}` → Set of AuthenticatedSocket references.
   * Populated during joinRoom / cleaned during leaveRoom.
   * Avoids the unsafe double-cast on RemoteSocket from fetchSockets() which
   * would not carry custom properties (e.g. userId) in a multi-node setup.
   */
  private readonly userSocketMap = new Map<string, Set<AuthenticatedSocket>>();

  private static sessionRoom(sessionId: string): string {
    return `session:${sessionId}`;
  }

  private static userKey(sessionId: string, userId: string): string {
    return `${sessionId}:${userId}`;
  }

  async joinRoom(socket: AuthenticatedSocket, sessionId: string): Promise<void> {
    const room = RoomManagerService.sessionRoom(sessionId);
    await socket.join(room);

    const key = RoomManagerService.userKey(sessionId, socket.userId);
    let sockets = this.userSocketMap.get(key);
    if (!sockets) {
      sockets = new Set();
      this.userSocketMap.set(key, sockets);
    }
    sockets.add(socket);

    this.logger.log(
      `Socket ${socket.id} (userId: ${socket.userId}) joined room ${room}`,
    );
  }

  async leaveRoom(socket: AuthenticatedSocket, sessionId: string): Promise<void> {
    const room = RoomManagerService.sessionRoom(sessionId);
    await socket.leave(room);

    const key = RoomManagerService.userKey(sessionId, socket.userId);
    const sockets = this.userSocketMap.get(key);
    if (sockets) {
      sockets.delete(socket);
      if (sockets.size === 0) {
        this.userSocketMap.delete(key);
      }
    }

    this.logger.log(
      `Socket ${socket.id} (userId: ${socket.userId}) left room ${room}`,
    );
  }

  getRoomName(sessionId: string): string {
    return RoomManagerService.sessionRoom(sessionId);
  }

  /**
   * Returns sockets for a given user in a session room.
   * Uses an internal map instead of fetchSockets() to avoid unsafe double-cast
   * on RemoteSocket which would not carry custom properties in multi-node deployments.
   */
  findSocketsByUserId(
    _server: Server,
    sessionId: string,
    userId: string,
  ): AuthenticatedSocket[] {
    const key = RoomManagerService.userKey(sessionId, userId);
    const sockets = this.userSocketMap.get(key);
    return sockets ? [...sockets] : [];
  }
}
