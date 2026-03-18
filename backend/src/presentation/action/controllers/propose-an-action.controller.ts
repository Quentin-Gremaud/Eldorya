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
import { ProposeActionCommand } from '../../../session/action-pipeline/commands/propose-action.command.js';
import { ProposeActionDto } from '../dto/propose-action.dto.js';

@Controller('campaigns')
export class ProposeAnActionController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post(':campaignId/sessions/:sessionId/actions')
  @HttpCode(202)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async handle(
    @Param('campaignId', new ParseUUIDPipe()) campaignId: string,
    @Param('sessionId', new ParseUUIDPipe()) sessionId: string,
    @Body() dto: ProposeActionDto,
    @AuthUserId() userId: string,
  ): Promise<void> {
    await this.commandBus.execute(
      new ProposeActionCommand(
        dto.actionId,
        sessionId,
        campaignId,
        userId,
        dto.actionType,
        dto.description,
        dto.target ?? null,
      ),
    );
  }
}
