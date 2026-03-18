import {
  Controller,
  Post,
  Param,
  Body,
  HttpCode,
  ParseUUIDPipe,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { AuthUserId } from '../../../infrastructure/auth/auth-user-id.decorator.js';
import { RejectActionCommand } from '../../../session/action-pipeline/commands/reject-action.command.js';
import { RejectActionDto } from '../dto/reject-action.dto.js';

@Controller('campaigns')
export class RejectAnActionController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post(':campaignId/sessions/:sessionId/actions/:actionId/reject')
  @HttpCode(202)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async handle(
    @Param('campaignId', new ParseUUIDPipe()) campaignId: string,
    @Param('sessionId', new ParseUUIDPipe()) sessionId: string,
    @Param('actionId', new ParseUUIDPipe()) actionId: string,
    @Body() dto: RejectActionDto,
    @AuthUserId() userId: string,
  ): Promise<void> {
    await this.commandBus.execute(
      new RejectActionCommand(
        actionId,
        sessionId,
        campaignId,
        userId,
        dto.feedback,
      ),
    );
  }
}
