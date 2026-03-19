import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PingPlayerHandler } from './commands/ping-player.handler.js';
import { ProposeActionHandler } from './commands/propose-action.handler.js';
import { ValidateActionHandler } from './commands/validate-action.handler.js';
import { RejectActionHandler } from './commands/reject-action.handler.js';
import { ReorderActionQueueHandler } from './commands/reorder-action-queue.handler.js';
import { CancelActionHandler } from './commands/cancel-action.handler.js';
import { ACTION_PIPELINE_REPOSITORY } from './action-pipeline.repository.js';
import { KurrentDbActionPipelineRepository } from '../../infrastructure/session/kurrentdb-action-pipeline.repository.js';
import { SystemClock, CLOCK } from '../../shared/clock.js';
import { SESSION_LIVENESS_CHECKER } from './session-liveness-checker.port.js';
import { PrismaSessionLivenessChecker } from '../../infrastructure/session/session-liveness-checker.adapter.js';
import { CAMPAIGN_MEMBERSHIP_CHECKER } from './campaign-membership-checker.port.js';
import { PrismaCampaignMembershipChecker } from '../../infrastructure/session/campaign-membership-checker.adapter.js';
import { PIPELINE_MODE_CHECKER } from './pipeline-mode-checker.port.js';
import { PrismaPipelineModeChecker } from '../../infrastructure/session/pipeline-mode-checker.adapter.js';

@Module({
  imports: [CqrsModule],
  providers: [
    PingPlayerHandler,
    ProposeActionHandler,
    ValidateActionHandler,
    RejectActionHandler,
    ReorderActionQueueHandler,
    CancelActionHandler,
    {
      provide: ACTION_PIPELINE_REPOSITORY,
      useClass: KurrentDbActionPipelineRepository,
    },
    { provide: CLOCK, useClass: SystemClock },
    {
      provide: SESSION_LIVENESS_CHECKER,
      useClass: PrismaSessionLivenessChecker,
    },
    {
      provide: CAMPAIGN_MEMBERSHIP_CHECKER,
      useClass: PrismaCampaignMembershipChecker,
    },
    {
      provide: PIPELINE_MODE_CHECKER,
      useClass: PrismaPipelineModeChecker,
    },
  ],
})
export class ActionPipelineModule {}
