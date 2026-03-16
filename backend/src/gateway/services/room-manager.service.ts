import { Injectable, Logger } from '@nestjs/common';
import type { AuthenticatedSocket } from '../types/authenticated-socket.js';

@Injectable()
export class RoomManagerService {
  private readonly logger = new Logger(RoomManagerService.name);

  private static sessionRoom(sessionId: string): string {
    return `session:${sessionId}`;
  }

  async joinRoom(socket: AuthenticatedSocket, sessionId: string): Promise<void> {
    const room = RoomManagerService.sessionRoom(sessionId);
    await socket.join(room);
    this.logger.log(
      `Socket ${socket.id} (userId: ${socket.userId}) joined room ${room}`,
    );
  }

  async leaveRoom(socket: AuthenticatedSocket, sessionId: string): Promise<void> {
    const room = RoomManagerService.sessionRoom(sessionId);
    await socket.leave(room);
    this.logger.log(
      `Socket ${socket.id} (userId: ${socket.userId}) left room ${room}`,
    );
  }

  getRoomName(sessionId: string): string {
    return RoomManagerService.sessionRoom(sessionId);
  }
}
