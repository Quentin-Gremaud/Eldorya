import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PingAPlayerController } from './controllers/ping-a-player.controller.js';
import { ProposeAnActionController } from './controllers/propose-an-action.controller.js';
import { GetPendingActionsController } from './controllers/get-pending-actions.controller.js';
import { GetPingStatusController } from './controllers/get-ping-status.controller.js';
import { ActionFinder } from './finders/action.finder.js';
import { ActionProjection } from './projections/action.projection.js';
import { SessionPresentationModule } from '../session/session-presentation.module.js';

@Module({
  imports: [CqrsModule, SessionPresentationModule],
  controllers: [
    PingAPlayerController,            // POST /campaigns/:campaignId/sessions/:sessionId/ping
    ProposeAnActionController,        // POST /campaigns/:campaignId/sessions/:sessionId/actions
    GetPendingActionsController,      // GET /campaigns/:campaignId/sessions/:sessionId/actions/pending
    GetPingStatusController,          // GET /campaigns/:campaignId/sessions/:sessionId/ping-status
  ],
  providers: [
    ActionFinder,
    ActionProjection,
  ],
  exports: [ActionFinder],
})
export class ActionPresentationModule {}
