import { Injectable, Logger } from '@nestjs/common';
import { createClerkClient } from '@clerk/backend';

@Injectable()
export class ClerkAdminService {
  private readonly logger = new Logger(ClerkAdminService.name);
  private readonly clerk;

  constructor() {
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) {
      this.logger.warn(
        'CLERK_SECRET_KEY is not set — Clerk admin operations will fail',
      );
    }
    this.clerk = createClerkClient({ secretKey });
  }

  async deleteUser(clerkUserId: string): Promise<void> {
    await this.clerk.users.deleteUser(clerkUserId);
    this.logger.log(`Clerk account deleted for user ${clerkUserId}`);
  }
}
