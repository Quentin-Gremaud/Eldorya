import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { RegisterAUserController } from './controllers/register-a-user.controller.js';
import { DeleteOwnAccountController } from './controllers/delete-own-account.controller.js';
import { GetActiveCampaignsAsGmController } from './controllers/get-active-campaigns-as-gm.controller.js';
import { UserProjection } from './projections/user.projection.js';
import { GetUserActiveCampaignsHandler } from './queries/get-user-active-campaigns.handler.js';
import { UserActiveCampaignsFinder } from './finders/user-active-campaigns.finder.js';
import { GdprModule } from '../../infrastructure/gdpr/gdpr.module.js';

@Module({
  imports: [CqrsModule, GdprModule],
  controllers: [
    RegisterAUserController,
    DeleteOwnAccountController,
    GetActiveCampaignsAsGmController,
  ],
  providers: [
    UserProjection,
    GetUserActiveCampaignsHandler,
    UserActiveCampaignsFinder,
  ],
})
export class UserPresentationModule {}
