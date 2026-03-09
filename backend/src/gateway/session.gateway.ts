import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { ClerkTokenVerifierService } from '../infrastructure/auth/clerk-token-verifier.service.js';
import { AuthenticatedSocket } from './types/authenticated-socket.js';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class SessionGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(SessionGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private readonly tokenVerifier: ClerkTokenVerifierService) {}

  afterInit() {
    // Socket.io middleware uses next() callback, async is safe here
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    this.server.use(async (socket, next) => {
      const token = socket.handshake.auth?.token as string | undefined;

      if (!token) {
        return next(new Error('Authentication failed: missing token'));
      }

      try {
        const payload = await this.tokenVerifier.verify(token);
        (socket as AuthenticatedSocket).userId = payload.sub;
        next();
      } catch {
        next(new Error('Authentication failed: invalid token'));
      }
    });

    this.logger.log('WebSocket Gateway initialized with JWT authentication');
  }

  handleConnection(client: AuthenticatedSocket) {
    this.logger.log(
      `Client connected: ${client.id} (userId: ${client.userId})`,
    );
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(
      `Client disconnected: ${client.id} (userId: ${client.userId})`,
    );
  }
}
