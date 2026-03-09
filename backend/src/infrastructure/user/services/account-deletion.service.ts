import { Injectable, Logger } from '@nestjs/common';
import { CryptoShreddingService } from '../../gdpr/crypto-shredding.service.js';
import { PrismaService } from '../../database/prisma.service.js';
import { ClerkAdminService } from '../../auth/clerk-admin.service.js';

@Injectable()
export class AccountDeletionService {
  private readonly logger = new Logger(AccountDeletionService.name);

  constructor(
    private readonly cryptoShredding: CryptoShreddingService,
    private readonly prisma: PrismaService,
    private readonly clerkAdmin: ClerkAdminService,
  ) {}

  async executePostDeletionSideEffects(clerkUserId: string): Promise<void> {
    // Step 1: Destroy encryption key (GDPR — most critical step)
    await this.cryptoShredding.destroyKey(clerkUserId);
    this.logger.log(`Crypto-shredding key destroyed for user ${clerkUserId}`);

    // Step 2: Anonymize read model (defense in depth)
    // Wrapped in try/catch: if this fails, step 1 (key destruction) already ensures GDPR compliance
    try {
      const updateResult = await this.prisma.user.updateMany({
        where: { clerkUserId },
        data: {
          email: '[deleted]',
          firstName: null,
          lastName: null,
        },
      });
      if (updateResult.count > 0) {
        this.logger.log(`Read model anonymized for user ${clerkUserId}`);
      } else {
        this.logger.warn(
          `No user record found in read model for ${clerkUserId} — skipping anonymization`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to anonymize read model for user ${clerkUserId}. GDPR key already destroyed — encrypted event data is unreadable.`,
        error instanceof Error ? error.stack : undefined,
      );
    }

    // Step 3: Delete Clerk account (external system cleanup)
    // If this fails, steps 1-2 already ensure GDPR compliance
    try {
      await this.clerkAdmin.deleteUser(clerkUserId);
      this.logger.log(`Clerk account deleted for user ${clerkUserId}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete Clerk account for user ${clerkUserId}. GDPR compliance maintained (key destroyed, data anonymized). Manual Clerk deletion may be required.`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
