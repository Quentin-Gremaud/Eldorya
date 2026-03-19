import {
  Controller,
  Post,
  Param,
  HttpCode,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { AuthUserId } from '../../../infrastructure/auth/auth-user-id.decorator.js';
import { CancelActionCommand } from '../../../session/action-pipeline/commands/cancel-action.command.js';

@Controller('campaigns')
export class CancelAnActionController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post(':campaignId/sessions/:sessionId/actions/:actionId/cancel')
  @HttpCode(202)
  async handle(
    @Param('campaignId', new ParseUUIDPipe()) campaignId: string,
    @Param('sessionId', new ParseUUIDPipe()) sessionId: string,
    @Param('actionId', new ParseUUIDPipe()) actionId: string,
    @AuthUserId() userId: string,
  ): Promise<void> {
    await this.commandBus.execute(
      new CancelActionCommand(
        actionId,
        sessionId,
        campaignId,
        userId,
      ),
    );
  }
}
