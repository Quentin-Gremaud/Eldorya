import { Module } from '@nestjs/common';
import { SessionSessionModule } from './session/session.module.js';
import { ActionPipelineModule } from './action-pipeline/action-pipeline.module.js';

@Module({
  imports: [SessionSessionModule, ActionPipelineModule],
})
export class SessionModule {}
