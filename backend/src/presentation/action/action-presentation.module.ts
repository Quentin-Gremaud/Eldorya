import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PingAPlayerController } from './controllers/ping-a-player.controller.js';
import { ProposeAnActionController } from './controllers/propose-an-action.controller.js';
import { GetPendingActionsController } from './controllers/get-pending-actions.controller.js';
import { GetPingStatusController } from './controllers/get-ping-status.controller.js';
import { ValidateAnActionController } from './controllers/validate-an-action.controller.js';
import { RejectAnActionController } from './controllers/reject-an-action.controller.js';
import { ReorderActionQueueController } from './controllers/reorder-action-queue.controller.js';
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
    ValidateAnActionController,       // POST /campaigns/:campaignId/sessions/:sessionId/actions/:actionId/validate
    RejectAnActionController,         // POST /campaigns/:campaignId/sessions/:sessionId/actions/:actionId/reject
    ReorderActionQueueController,     // PUT /campaigns/:campaignId/sessions/:sessionId/actions/reorder
  ],
  providers: [
    ActionFinder,
    ActionProjection,
  ],
  exports: [ActionFinder],
})
export class ActionPresentationModule {}
