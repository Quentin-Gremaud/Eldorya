import {
  Controller,
  Get,
  Param,
  NotFoundException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthUserId } from '../../../infrastructure/auth/auth-user-id.decorator.js';
import { SessionFinder } from '../finders/session.finder.js';

@Controller('campaigns')
export class GetPipelineModeController {
  constructor(private readonly sessionFinder: SessionFinder) {}

  @Get(':campaignId/sessions/:sessionId/pipeline-mode')
  async handle(
    @Param('campaignId', new ParseUUIDPipe()) campaignId: string,
    @Param('sessionId', new ParseUUIDPipe()) sessionId: string,
    @AuthUserId() _userId: string,
  ): Promise<{ data: { pipelineMode: string } }> {
    const result = await this.sessionFinder.getPipelineMode(sessionId, campaignId);
    if (!result) throw new NotFoundException();

    return { data: result };
  }
}
