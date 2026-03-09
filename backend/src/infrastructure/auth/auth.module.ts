import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ClerkAuthGuard } from './clerk-auth.guard.js';
import { ClerkTokenVerifierService } from './clerk-token-verifier.service.js';
import { ClerkAdminService } from './clerk-admin.service.js';

@Module({
  providers: [
    ClerkTokenVerifierService,
    ClerkAdminService,
    {
      provide: APP_GUARD,
      useClass: ClerkAuthGuard,
    },
  ],
  exports: [ClerkTokenVerifierService, ClerkAdminService],
})
export class AuthModule {}
