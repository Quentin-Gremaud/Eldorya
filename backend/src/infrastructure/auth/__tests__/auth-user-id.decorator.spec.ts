import { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { AuthUserId } from '../auth-user-id.decorator.js';

describe('AuthUserId decorator', () => {
  function getParamDecoratorFactory(): (
    data: unknown,
    ctx: ExecutionContext,
  ) => string | undefined {
    class TestController {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      testRoute(@AuthUserId() _userId: string) {}
    }

    const args = Reflect.getMetadata(
      ROUTE_ARGS_METADATA,
      TestController,
      'testRoute',
    ) as Record<
      string,
      { factory: (data: unknown, ctx: ExecutionContext) => string | undefined }
    >;

    const key = Object.keys(args)[0];
    return args[key].factory;
  }

  it('extracts userId from request when set by AuthGuard', () => {
    const factory = getParamDecoratorFactory();
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({ userId: 'user_abc123' }),
      }),
    } as unknown as ExecutionContext;

    const result = factory(undefined, mockContext);

    expect(result).toBe('user_abc123');
  });

  it('returns undefined when userId is not set on request', () => {
    const factory = getParamDecoratorFactory();
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    } as unknown as ExecutionContext;

    const result = factory(undefined, mockContext);

    expect(result).toBeUndefined();
  });
});
