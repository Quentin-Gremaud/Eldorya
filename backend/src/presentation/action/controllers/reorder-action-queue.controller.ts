import {
  Controller,
  Put,
  Param,
  Body,
  HttpCode,
  ParseUUIDPipe,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { AuthUserId } from '../../../infrastructure/auth/auth-user-id.decorator.js';
import { ReorderActionQueueCommand } from '../../../session/action-pipeline/commands/reorder-action-queue.command.js';
import { ReorderActionQueueDto } from '../dto/reorder-action-queue.dto.js';

@Controller('campaigns')
export class ReorderActionQueueController {
  constructor(private readonly commandBus: CommandBus) {}

  @Put(':campaignId/sessions/:sessionId/actions/reorder')
  @HttpCode(202)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async handle(
    @Param('campaignId', new ParseUUIDPipe()) campaignId: string,
    @Param('sessionId', new ParseUUIDPipe()) sessionId: string,
    @Body() dto: ReorderActionQueueDto,
    @AuthUserId() userId: string,
  ): Promise<void> {
    await this.commandBus.execute(
      new ReorderActionQueueCommand(
        sessionId,
        campaignId,
        dto.orderedActionIds,
        userId,
      ),
    );
  }
}
