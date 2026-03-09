import { RequestAccountDeletionHandler } from '../commands/request-account-deletion.handler';
import { RequestAccountDeletionCommand } from '../commands/request-account-deletion.command';
import { KurrentDbService } from '../../eventstore/kurrentdb.service';
import { AccountDeletionService } from '../services/account-deletion.service';

describe('RequestAccountDeletionHandler', () => {
  let handler: RequestAccountDeletionHandler;
  let kurrentDb: { readStream: jest.Mock; appendToStream: jest.Mock };
  let accountDeletionService: { executePostDeletionSideEffects: jest.Mock };

  const clerkUserId = 'clerk_user_123';

  beforeEach(() => {
    kurrentDb = {
      readStream: jest.fn().mockResolvedValue([]),
      appendToStream: jest.fn().mockResolvedValue(undefined),
    };

    accountDeletionService = {
      executePostDeletionSideEffects: jest.fn().mockResolvedValue(undefined),
    };

    handler = new RequestAccountDeletionHandler(
      kurrentDb as unknown as KurrentDbService,
      accountDeletionService as unknown as AccountDeletionService,
    );
  });

  it('should persist event and execute side effects for registered user', async () => {
    kurrentDb.readStream.mockResolvedValue([
      {
        type: 'UserRegistered',
        data: {
          clerkUserId,
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          ageDeclaration: true,
          ageDeclarationTimestamp: '2026-01-01T00:00:00.000Z',
          registeredAt: '2026-01-01T00:00:00.000Z',
        },
      },
    ]);

    await handler.execute(new RequestAccountDeletionCommand(clerkUserId));

    expect(kurrentDb.appendToStream).toHaveBeenCalledTimes(1);
    expect(kurrentDb.appendToStream).toHaveBeenCalledWith(
      `user-${clerkUserId}`,
      'AccountDeletionRequested',
      expect.objectContaining({ clerkUserId }),
      expect.objectContaining({ correlationId: expect.any(String) }),
    );
    expect(
      accountDeletionService.executePostDeletionSideEffects,
    ).toHaveBeenCalledWith(clerkUserId);
  });

  it('should persist event and execute side effects when stream not found (unregistered user)', async () => {
    kurrentDb.readStream.mockRejectedValue(new Error('Stream not found'));

    await handler.execute(new RequestAccountDeletionCommand(clerkUserId));

    expect(kurrentDb.appendToStream).toHaveBeenCalledTimes(1);
    expect(kurrentDb.appendToStream).toHaveBeenCalledWith(
      `user-${clerkUserId}`,
      'AccountDeletionRequested',
      expect.objectContaining({ clerkUserId }),
      expect.objectContaining({ correlationId: expect.any(String) }),
    );
    expect(
      accountDeletionService.executePostDeletionSideEffects,
    ).toHaveBeenCalledWith(clerkUserId);
  });

  it('should skip deletion for already deleted user (idempotent)', async () => {
    kurrentDb.readStream.mockResolvedValue([
      {
        type: 'UserRegistered',
        data: {
          clerkUserId,
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          ageDeclaration: true,
          ageDeclarationTimestamp: '2026-01-01T00:00:00.000Z',
          registeredAt: '2026-01-01T00:00:00.000Z',
        },
      },
      {
        type: 'AccountDeletionRequested',
        data: {
          clerkUserId,
          requestedAt: '2026-03-04T00:00:00.000Z',
        },
      },
    ]);

    await handler.execute(new RequestAccountDeletionCommand(clerkUserId));

    expect(kurrentDb.appendToStream).not.toHaveBeenCalled();
    expect(
      accountDeletionService.executePostDeletionSideEffects,
    ).not.toHaveBeenCalled();
  });

  it('should persist event for unregistered user with empty stream', async () => {
    kurrentDb.readStream.mockResolvedValue([]);

    await handler.execute(new RequestAccountDeletionCommand(clerkUserId));

    expect(kurrentDb.appendToStream).toHaveBeenCalledTimes(1);
    expect(
      accountDeletionService.executePostDeletionSideEffects,
    ).toHaveBeenCalledWith(clerkUserId);
  });

  it('should propagate errors from side effects', async () => {
    kurrentDb.readStream.mockResolvedValue([]);
    accountDeletionService.executePostDeletionSideEffects.mockRejectedValue(
      new Error('Side effect failure'),
    );

    await expect(
      handler.execute(new RequestAccountDeletionCommand(clerkUserId)),
    ).rejects.toThrow('Side effect failure');
  });
});
