import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { RegisterAUserHandler } from './commands/register-a-user.handler.js';
import { RequestAccountDeletionHandler } from './commands/request-account-deletion.handler.js';
import { AccountDeletionService } from './services/account-deletion.service.js';
import { GdprModule } from '../gdpr/gdpr.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [CqrsModule, GdprModule, AuthModule],
  providers: [
    RegisterAUserHandler,
    RequestAccountDeletionHandler,
    AccountDeletionService,
  ],
  exports: [AccountDeletionService],
})
export class UserModule {}
