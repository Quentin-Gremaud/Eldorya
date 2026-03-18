import {
  Controller,
  Get,
  Param,
  NotFoundException,
  ForbiddenException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthUserId } from '../../../infrastructure/auth/auth-user-id.decorator.js';
import { SessionFinder } from '../../session/finders/session.finder.js';
import { ActionFinder } from '../finders/action.finder.js';

@Controller('campaigns')
export class GetPendingActionsController {
  constructor(
    private readonly sessionFinder: SessionFinder,
    private readonly actionFinder: ActionFinder,
  ) {}

  @Get(':campaignId/sessions/:sessionId/actions/pending')
  async handle(
    @Param('campaignId', new ParseUUIDPipe()) campaignId: string,
    @Param('sessionId', new ParseUUIDPipe()) sessionId: string,
    @AuthUserId() userId: string,
  ): Promise<{ data: unknown[] }> {
    const session = await this.sessionFinder.findById(sessionId);
    if (!session) throw new NotFoundException();
    if (session.campaignId !== campaignId) throw new NotFoundException();
    if (session.gmUserId !== userId) throw new ForbiddenException();

    const actions = await this.actionFinder.findPendingActionsBySession(sessionId, campaignId);
    return { data: actions };
  }
}
