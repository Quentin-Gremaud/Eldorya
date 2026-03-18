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
import { PingPlayerCommand } from '../../../session/action-pipeline/commands/ping-player.command.js';
import { PingPlayerDto } from '../dto/ping-player.dto.js';

@Controller('campaigns')
export class PingAPlayerController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post(':campaignId/sessions/:sessionId/ping')
  @HttpCode(202)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async handle(
    @Param('campaignId', new ParseUUIDPipe()) campaignId: string,
    @Param('sessionId', new ParseUUIDPipe()) sessionId: string,
    @Body() dto: PingPlayerDto,
    @AuthUserId() userId: string,
  ): Promise<void> {
    await this.commandBus.execute(
      new PingPlayerCommand(sessionId, campaignId, userId, dto.playerId),
    );
  }
}
