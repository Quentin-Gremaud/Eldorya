import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClerkAuthGuard } from '../clerk-auth.guard.js';
import { ClerkTokenVerifierService } from '../clerk-token-verifier.service.js';

jest.mock('@clerk/backend', () => ({
  verifyToken: jest.fn(),
}));

import { verifyToken } from '@clerk/backend';

const mockedVerifyToken = verifyToken as jest.MockedFunction<
  typeof verifyToken
>;

describe('ClerkAuthGuard', () => {
  let guard: ClerkAuthGuard;
  let reflector: Reflector;
  let tokenVerifier: ClerkTokenVerifierService;

  const createMockExecutionContext = (
    headers: Record<string, string> = {},
    isPublic = false,
  ): ExecutionContext => {
    const request: { headers: Record<string, string>; userId?: string } = {
      headers,
      userId: undefined,
    };
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(isPublic);

    return mockContext;
  };

  beforeEach(() => {
    process.env.CLERK_SECRET_KEY = 'sk_test_xxx';
    process.env.CLERK_JWT_KEY = 'test-jwt-key';

    reflector = new Reflector();
    tokenVerifier = new ClerkTokenVerifierService();
    tokenVerifier.onModuleInit();
    guard = new ClerkAuthGuard(reflector, tokenVerifier);
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.CLERK_JWT_KEY;
    delete process.env.CLERK_SECRET_KEY;
  });

  it('grants access with valid JWT and attaches userId to request', async () => {
    mockedVerifyToken.mockResolvedValue({
      sub: 'user_123',
      sid: 'sess_456',
    } as any);

    const context = createMockExecutionContext({
      authorization: 'Bearer valid-jwt-token',
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockedVerifyToken).toHaveBeenCalledWith('valid-jwt-token', {
      jwtKey: 'test-jwt-key',
    });
    const request = context.switchToHttp().getRequest<{ userId?: string }>();
    expect(request.userId).toBe('user_123');
  });

  it('throws UnauthorizedException when authorization header is missing', async () => {
    const context = createMockExecutionContext({});

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(mockedVerifyToken).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedException when JWT is invalid', async () => {
    mockedVerifyToken.mockRejectedValue(new Error('Invalid JWT'));

    const context = createMockExecutionContext({
      authorization: 'Bearer invalid-token',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('bypasses authentication for routes decorated with @Public()', async () => {
    const context = createMockExecutionContext({}, true);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockedVerifyToken).not.toHaveBeenCalled();
  });

  it('extracts token correctly from Bearer prefix', async () => {
    mockedVerifyToken.mockResolvedValue({ sub: 'user_789' } as any);

    const context = createMockExecutionContext({
      authorization: 'Bearer my-special-token',
    });

    await guard.canActivate(context);

    expect(mockedVerifyToken).toHaveBeenCalledWith('my-special-token', {
      jwtKey: 'test-jwt-key',
    });
  });

  it('rejects non-Bearer authorization schemes', async () => {
    const context = createMockExecutionContext({
      authorization: 'Basic dXNlcjpwYXNz',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(mockedVerifyToken).not.toHaveBeenCalled();
  });

  it('falls back to secretKey when CLERK_JWT_KEY is not set', async () => {
    delete process.env.CLERK_JWT_KEY;
    tokenVerifier = new ClerkTokenVerifierService();
    tokenVerifier.onModuleInit();
    guard = new ClerkAuthGuard(reflector, tokenVerifier);

    mockedVerifyToken.mockResolvedValue({ sub: 'user_456' } as any);

    const context = createMockExecutionContext({
      authorization: 'Bearer some-token',
    });

    await guard.canActivate(context);

    expect(mockedVerifyToken).toHaveBeenCalledWith('some-token', {
      secretKey: 'sk_test_xxx',
    });
  });

  it('throws when neither CLERK_JWT_KEY nor CLERK_SECRET_KEY is configured', async () => {
    delete process.env.CLERK_JWT_KEY;
    delete process.env.CLERK_SECRET_KEY;
    tokenVerifier = new ClerkTokenVerifierService();
    tokenVerifier.onModuleInit();
    guard = new ClerkAuthGuard(reflector, tokenVerifier);

    const context = createMockExecutionContext({
      authorization: 'Bearer some-token',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
