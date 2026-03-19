import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { StartASessionController } from './controllers/start-a-session.controller.js';
import { ChangeASessionModeController } from './controllers/change-a-session-mode.controller.js';
import { GetActiveSessionController } from './controllers/get-active-session.controller.js';
import { TogglePipelineModeController } from './controllers/toggle-pipeline-mode.controller.js';
import { GetPipelineModeController } from './controllers/get-pipeline-mode.controller.js';
import { SessionFinder } from './finders/session.finder.js';
import { SessionProjection } from './projections/session.projection.js';
import { CampaignPresentationModule } from '../campaign/campaign-presentation.module.js';

@Module({
  imports: [CqrsModule, CampaignPresentationModule],
  controllers: [
    GetActiveSessionController,       // GET /campaigns/:campaignId/sessions/active
    StartASessionController,          // POST /campaigns/:campaignId/sessions
    ChangeASessionModeController,     // PUT /campaigns/:campaignId/sessions/:sessionId/mode
    TogglePipelineModeController,     // PUT /campaigns/:campaignId/sessions/:sessionId/pipeline-mode
    GetPipelineModeController,        // GET /campaigns/:campaignId/sessions/:sessionId/pipeline-mode
  ],
  providers: [
    SessionFinder,
    SessionProjection,
  ],
  exports: [SessionFinder],
})
export class SessionPresentationModule {}
