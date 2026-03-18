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
export class GetPingStatusController {
  constructor(
    private readonly sessionFinder: SessionFinder,
    private readonly actionFinder: ActionFinder,
  ) {}

  @Get(':campaignId/sessions/:sessionId/ping-status')
  async handle(
    @Param('campaignId', new ParseUUIDPipe()) campaignId: string,
    @Param('sessionId', new ParseUUIDPipe()) sessionId: string,
    @AuthUserId() userId: string,
  ): Promise<{ data: unknown }> {
    const session = await this.sessionFinder.findById(sessionId);
    if (!session) throw new NotFoundException();
    if (session.campaignId !== campaignId) throw new NotFoundException();

    const isGm = session.gmUserId === userId;
    if (!isGm) {
      const isMember = await this.actionFinder.isCampaignMember(campaignId, userId);
      if (!isMember) throw new ForbiddenException();
    }

    const pingStatus = await this.actionFinder.findCurrentPingStatus(sessionId, campaignId);
    return { data: pingStatus };
  }
}
