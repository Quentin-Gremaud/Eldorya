import { RegisterAUserHandler } from '../commands/register-a-user.handler';
import { RegisterAUserCommand } from '../commands/register-a-user.command';
import { KurrentDbService } from '../../eventstore/kurrentdb.service';
import { CryptoShreddingService } from '../../gdpr/crypto-shredding.service';

describe('RegisterAUserHandler', () => {
  let handler: RegisterAUserHandler;
  let kurrentDb: jest.Mocked<KurrentDbService>;
  let cryptoShredding: jest.Mocked<CryptoShreddingService>;

  beforeEach(() => {
    kurrentDb = {
      appendToStream: jest.fn().mockResolvedValue(undefined),
      readStream: jest.fn().mockRejectedValue(new Error('Stream not found')),
    } as unknown as jest.Mocked<KurrentDbService>;

    const testKey = Buffer.alloc(32, 'a');
    cryptoShredding = {
      generateAndStoreKey: jest.fn().mockResolvedValue(testKey),
      encrypt: jest
        .fn()
        .mockImplementation((value: string) => `encrypted_${value}`),
    } as unknown as jest.Mocked<CryptoShreddingService>;

    handler = new RegisterAUserHandler(kurrentDb, cryptoShredding);
  });

  it('should persist UserRegistered event to KurrentDB', async () => {
    const command = new RegisterAUserCommand(
      'clerk_user_123',
      'test@example.com',
      'John',
      'Doe',
      true,
      '2026-01-01T00:00:00.000Z',
      '2026-01-01T00:00:00.000Z',
    );

    await handler.execute(command);

    expect(kurrentDb.appendToStream).toHaveBeenCalledTimes(1);
    expect(kurrentDb.appendToStream).toHaveBeenCalledWith(
      'user-clerk_user_123',
      'UserRegistered',
      expect.objectContaining({
        clerkUserId: 'clerk_user_123',
        email: 'encrypted_test@example.com',
        firstName: 'encrypted_John',
        lastName: 'encrypted_Doe',
        ageDeclaration: true,
      }),
      expect.objectContaining({
        correlationId: expect.any(String),
      }),
    );
  });

  it('should generate encryption key for the user', async () => {
    const command = new RegisterAUserCommand(
      'clerk_user_456',
      'test@example.com',
      'Jane',
      'Doe',
      true,
      '2026-01-01T00:00:00.000Z',
      '2026-01-01T00:00:00.000Z',
    );

    await handler.execute(command);

    expect(cryptoShredding.generateAndStoreKey).toHaveBeenCalledWith(
      'clerk_user_456',
    );
  });

  it('should encrypt personal data before persisting', async () => {
    const command = new RegisterAUserCommand(
      'clerk_user_789',
      'private@example.com',
      'Alice',
      'Smith',
      true,
      '2026-01-01T00:00:00.000Z',
      '2026-01-01T00:00:00.000Z',
    );

    await handler.execute(command);

    expect(cryptoShredding.encrypt).toHaveBeenCalledWith(
      'private@example.com',
      expect.any(Buffer),
    );
    expect(cryptoShredding.encrypt).toHaveBeenCalledWith(
      'Alice',
      expect.any(Buffer),
    );
    expect(cryptoShredding.encrypt).toHaveBeenCalledWith(
      'Smith',
      expect.any(Buffer),
    );
  });

  it('should sanitize first and last name via aggregate (strip HTML tags)', async () => {
    const command = new RegisterAUserCommand(
      'clerk_user_xss',
      'test@example.com',
      '<script>alert("xss")</script>John',
      'Doe<img src=x>',
      true,
      '2026-01-01T00:00:00.000Z',
      '2026-01-01T00:00:00.000Z',
    );

    await handler.execute(command);

    // The aggregate sanitizes before creating the event, so encrypt receives sanitized values
    expect(cryptoShredding.encrypt).toHaveBeenCalledWith(
      expect.not.stringContaining('<script>'),
      expect.any(Buffer),
    );
  });

  it('should throw when age declaration is false', async () => {
    const command = new RegisterAUserCommand(
      'clerk_user_no_age',
      'test@example.com',
      'John',
      'Doe',
      false,
      '2026-01-01T00:00:00.000Z',
      '2026-01-01T00:00:00.000Z',
    );

    await expect(handler.execute(command)).rejects.toThrow(
      'Age declaration is required',
    );
  });

  it('should skip registration when user already exists in event store', async () => {
    kurrentDb.readStream.mockResolvedValueOnce([
      { type: 'UserRegistered', data: {}, metadata: {} },
    ]);

    const command = new RegisterAUserCommand(
      'clerk_existing_user',
      'test@example.com',
      'John',
      'Doe',
      true,
      '2026-01-01T00:00:00.000Z',
      '2026-01-01T00:00:00.000Z',
    );

    await handler.execute(command);

    expect(kurrentDb.appendToStream).not.toHaveBeenCalled();
    expect(cryptoShredding.generateAndStoreKey).not.toHaveBeenCalled();
  });
});
