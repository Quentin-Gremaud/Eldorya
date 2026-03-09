import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { ListUserCampaignsController } from './controllers/list-user-campaigns.controller.js';
import { CreateCampaignInvitationController } from './controllers/create-campaign-invitation.controller.js';
import { ValidateInvitationController } from './controllers/validate-invitation.controller.js';
import { AcceptInvitationController } from './controllers/accept-invitation.controller.js';
import { RevokeACampaignInvitationController } from './controllers/revoke-a-campaign-invitation.controller.js';
import { GetCampaignInvitationController } from './controllers/get-campaign-invitation.controller.js';
import { CreateACampaignController } from './controllers/create-a-campaign.controller.js';
import { GetCampaignActiveCountController } from './controllers/get-campaign-active-count.controller.js';
import { GetPlayerCampaignsController } from './controllers/get-player-campaigns.controller.js';
import { GetCampaignPlayersController } from './controllers/get-campaign-players.controller.js';
import { SendACampaignAnnouncementController } from './controllers/send-a-campaign-announcement.controller.js';
import { ArchiveACampaignController } from './controllers/archive-a-campaign.controller.js';
import { ReactivateACampaignController } from './controllers/reactivate-a-campaign.controller.js';
import { GetCampaignAnnouncementsController } from './controllers/get-campaign-announcements.controller.js';
import { GetCampaignDetailController } from './controllers/get-campaign-detail.controller.js';
import { GetUserCampaignsHandler } from './queries/get-user-campaigns.handler.js';
import { UserCampaignsFinder } from './finders/user-campaigns.finder.js';
import { PlayerCampaignsFinder } from './finders/player-campaigns.finder.js';
import { CampaignDetailFinder } from './finders/campaign-detail.finder.js';
import { CampaignPlayersFinder } from './finders/campaign-players.finder.js';
import { CampaignAnnouncementsFinder } from './finders/campaign-announcements.finder.js';
import { InvitationFinder } from './finders/invitation.finder.js';
import { InvitationProjection } from './projections/invitation.projection.js';
import { CampaignProjection } from './projections/campaign.projection.js';
import { CampaignAnnouncementProjection } from './projections/campaign-announcement.projection.js';

@Module({
  imports: [CqrsModule, ConfigModule],
  controllers: [
    ListUserCampaignsController,
    CreateCampaignInvitationController,
    ValidateInvitationController,
    AcceptInvitationController,
    RevokeACampaignInvitationController,
    GetCampaignInvitationController,
    CreateACampaignController,
    GetCampaignActiveCountController,
    GetPlayerCampaignsController,
    GetCampaignPlayersController,
    SendACampaignAnnouncementController,
    ArchiveACampaignController,
    ReactivateACampaignController,
    GetCampaignAnnouncementsController,
    GetCampaignDetailController,
  ],
  providers: [
    GetUserCampaignsHandler,
    UserCampaignsFinder,
    PlayerCampaignsFinder,
    CampaignDetailFinder,
    CampaignPlayersFinder,
    CampaignAnnouncementsFinder,
    InvitationFinder,
    InvitationProjection,
    CampaignProjection,
    CampaignAnnouncementProjection,
  ],
})
export class CampaignPresentationModule {}
