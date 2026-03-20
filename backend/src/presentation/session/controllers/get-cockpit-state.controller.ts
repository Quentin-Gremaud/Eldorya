import {
  Controller,
  Get,
  Param,
  NotFoundException,
  ForbiddenException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthUserId } from '../../../infrastructure/auth/auth-user-id.decorator.js';
import {
  CockpitStateFinder,
  type CockpitStateResult,
} from '../finders/cockpit-state.finder.js';

@Controller('campaigns')
export class GetCockpitStateController {
  constructor(
    private readonly cockpitStateFinder: CockpitStateFinder,
  ) {}

  @Get(':campaignId/sessions/:sessionId/cockpit')
  async handle(
    @Param('campaignId', new ParseUUIDPipe()) campaignId: string,
    @Param('sessionId', new ParseUUIDPipe()) sessionId: string,
    @AuthUserId() userId: string,
  ): Promise<{ data: CockpitStateResult }> {
    const cockpitState = await this.cockpitStateFinder.findCockpitState(
      sessionId,
      campaignId,
    );
    if (!cockpitState) throw new NotFoundException();
    if (cockpitState.gmUserId !== userId) throw new ForbiddenException();

    return { data: cockpitState };
  }
}
