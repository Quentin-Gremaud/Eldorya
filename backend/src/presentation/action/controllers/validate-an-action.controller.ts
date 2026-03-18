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
import { ValidateActionCommand } from '../../../session/action-pipeline/commands/validate-action.command.js';
import { ValidateActionDto } from '../dto/validate-action.dto.js';

@Controller('campaigns')
export class ValidateAnActionController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post(':campaignId/sessions/:sessionId/actions/:actionId/validate')
  @HttpCode(202)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async handle(
    @Param('campaignId', new ParseUUIDPipe()) campaignId: string,
    @Param('sessionId', new ParseUUIDPipe()) sessionId: string,
    @Param('actionId', new ParseUUIDPipe()) actionId: string,
    @Body() dto: ValidateActionDto,
    @AuthUserId() userId: string,
  ): Promise<void> {
    await this.commandBus.execute(
      new ValidateActionCommand(
        actionId,
        sessionId,
        campaignId,
        userId,
        dto.narrativeNote ?? null,
      ),
    );
  }
}
