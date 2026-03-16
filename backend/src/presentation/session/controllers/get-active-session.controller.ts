import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { SessionFinder, type SessionResult } from '../finders/session.finder.js';

@Controller('campaigns')
export class GetActiveSessionController {
  constructor(private readonly sessionFinder: SessionFinder) {}

  @Get(':campaignId/sessions/active')
  async handle(
    @Param('campaignId', new ParseUUIDPipe()) campaignId: string,
  ): Promise<{ data: SessionResult | null }> {
    const session = await this.sessionFinder.findActiveSessionByCampaign(campaignId);
    return { data: session };
  }
}
