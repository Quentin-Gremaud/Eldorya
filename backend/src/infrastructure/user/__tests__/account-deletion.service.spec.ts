import { AccountDeletionService } from '../services/account-deletion.service';
import { CryptoShreddingService } from '../../gdpr/crypto-shredding.service';
import { PrismaService } from '../../database/prisma.service';
import { ClerkAdminService } from '../../auth/clerk-admin.service';

describe('AccountDeletionService', () => {
  let service: AccountDeletionService;
  let cryptoShredding: jest.Mocked<CryptoShreddingService>;
  let prisma: { user: { updateMany: jest.Mock } };
  let clerkAdmin: jest.Mocked<ClerkAdminService>;

  const clerkUserId = 'clerk_user_123';

  beforeEach(() => {
    cryptoShredding = {
      destroyKey: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<CryptoShreddingService>;

    prisma = {
      user: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };

    clerkAdmin = {
      deleteUser: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<ClerkAdminService>;

    service = new AccountDeletionService(
      cryptoShredding,
      prisma as unknown as PrismaService,
      clerkAdmin,
    );
  });

  it('should destroy the crypto-shredding key', async () => {
    await service.executePostDeletionSideEffects(clerkUserId);

    expect(cryptoShredding.destroyKey).toHaveBeenCalledWith(clerkUserId);
  });

  it('should anonymize the user read model', async () => {
    await service.executePostDeletionSideEffects(clerkUserId);

    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { clerkUserId },
      data: {
        email: '[deleted]',
        firstName: null,
        lastName: null,
      },
    });
  });

  it('should delete the Clerk account', async () => {
    await service.executePostDeletionSideEffects(clerkUserId);

    expect(clerkAdmin.deleteUser).toHaveBeenCalledWith(clerkUserId);
  });

  it('should execute operations in correct order: key destruction → anonymization → Clerk deletion', async () => {
    const callOrder: string[] = [];

    cryptoShredding.destroyKey.mockImplementation(async () => {
      callOrder.push('destroyKey');
    });
    prisma.user.updateMany.mockImplementation(async () => {
      callOrder.push('anonymize');
      return {};
    });
    clerkAdmin.deleteUser.mockImplementation(async () => {
      callOrder.push('deleteClerk');
    });

    await service.executePostDeletionSideEffects(clerkUserId);

    expect(callOrder).toEqual(['destroyKey', 'anonymize', 'deleteClerk']);
  });

  it('should still destroy key and anonymize data when Clerk deletion fails (GDPR priority)', async () => {
    clerkAdmin.deleteUser.mockRejectedValue(new Error('Clerk API unavailable'));

    await service.executePostDeletionSideEffects(clerkUserId);

    expect(cryptoShredding.destroyKey).toHaveBeenCalledWith(clerkUserId);
    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { clerkUserId },
      data: {
        email: '[deleted]',
        firstName: null,
        lastName: null,
      },
    });
  });

  it('should not throw when Clerk deletion fails', async () => {
    clerkAdmin.deleteUser.mockRejectedValue(new Error('Clerk API unavailable'));

    await expect(
      service.executePostDeletionSideEffects(clerkUserId),
    ).resolves.not.toThrow();
  });
});
