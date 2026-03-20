import { Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { SessionGateway } from './session.gateway';
import { ClerkTokenVerifierService } from '../infrastructure/auth/clerk-token-verifier.service';

jest.mock('@clerk/backend', () => ({
  verifyToken: jest.fn(),
}));

import { verifyToken } from '@clerk/backend';

const mockedVerifyToken = verifyToken as jest.MockedFunction<
  typeof verifyToken
>;

interface MockSocket {
  handshake: { auth: { token?: string } };
  userId?: string;
}

describe('SessionGateway', () => {
  let gateway: SessionGateway;
  let tokenVerifier: ClerkTokenVerifierService;
  let middlewareFn: (
    socket: MockSocket,
    next: (err?: Error) => void,
  ) => Promise<void>;

  beforeEach(() => {
    process.env.CLERK_JWT_KEY = 'test-jwt-key';

    tokenVerifier = new ClerkTokenVerifierService();
    tokenVerifier.onModuleInit();

    gateway = new SessionGateway(
      tokenVerifier,
      {} as any,
      {
        onPresenceChange: jest.fn(),
        start: jest.fn(),
        recordActivity: jest.fn(),
        playerConnected: jest.fn(),
        playerDisconnected: jest.fn(),
        getPresences: jest.fn().mockReturnValue([]),
      } as any,
      {} as any,
      { execute: jest.fn() } as any,
      {} as any,
    );
    jest.clearAllMocks();

    const mockServer = {
      use: jest.fn(
        (
          fn: (
            socket: MockSocket,
            next: (err?: Error) => void,
          ) => Promise<void>,
        ) => {
          middlewareFn = fn;
        },
      ),
    };
    gateway.server = mockServer as unknown as Server;
    gateway.afterInit();
  });

  afterEach(() => {
    delete process.env.CLERK_JWT_KEY;
    delete process.env.CLERK_SECRET_KEY;
  });

  describe('JWT middleware', () => {
    it('accepts connection with valid JWT and attaches userId', async () => {
      mockedVerifyToken.mockResolvedValue({ sub: 'user_ws_123' } as any);
      const socket: MockSocket = {
        handshake: { auth: { token: 'valid-token' } },
      };
      const next = jest.fn();

      await middlewareFn(socket, next);

      expect(next).toHaveBeenCalledWith();
      expect(socket.userId).toBe('user_ws_123');
      expect(mockedVerifyToken).toHaveBeenCalledWith('valid-token', {
        jwtKey: 'test-jwt-key',
      });
    });

    it('rejects connection when token is missing', async () => {
      const socket: MockSocket = { handshake: { auth: {} } };
      const next = jest.fn();

      await middlewareFn(socket, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Authentication failed: missing token',
        }),
      );
    });

    it('rejects connection when token is invalid', async () => {
      mockedVerifyToken.mockRejectedValue(new Error('Invalid'));
      const socket: MockSocket = {
        handshake: { auth: { token: 'bad-token' } },
      };
      const next = jest.fn();

      await middlewareFn(socket, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Authentication failed: invalid token',
        }),
      );
      expect(socket.userId).toBeUndefined();
    });
  });

  describe('connection handling', () => {
    it('logs authenticated userId on connection', () => {
      const logSpy = jest.spyOn(Logger.prototype, 'log');
      const mockSocket = { id: 'socket-1', userId: 'user_abc' };

      gateway.handleConnection(
        mockSocket as unknown as Parameters<typeof gateway.handleConnection>[0],
      );

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('user_abc'));
      logSpy.mockRestore();
    });

    it('logs authenticated userId on disconnection', () => {
      const logSpy = jest.spyOn(Logger.prototype, 'log');
      const mockSocket = { id: 'socket-1', userId: 'user_abc' };

      gateway.handleDisconnect(
        mockSocket as unknown as Parameters<typeof gateway.handleDisconnect>[0],
      );

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('user_abc'));
      logSpy.mockRestore();
    });
  });
});
