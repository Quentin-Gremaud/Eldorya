import {
  Controller,
  Put,
  Body,
  Param,
  UsePipes,
  ValidationPipe,
  HttpCode,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { AuthUserId } from '../../../infrastructure/auth/auth-user-id.decorator.js';
import { MoveTokenDto } from '../dto/move-token.dto.js';
import { MoveTokenCommand } from '../../../world/token/commands/move-token.command.js';
import { MapLevelFinder } from '../../map/finders/map-level.finder.js';

@Controller('campaigns')
export class MoveATokenController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly mapLevelFinder: MapLevelFinder,
  ) {}

  @Put(':campaignId/tokens/:tokenId/position')
  @HttpCode(202)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async handle(
    @Param('campaignId', new ParseUUIDPipe()) campaignId: string,
    @Param('tokenId', new ParseUUIDPipe()) tokenId: string,
    @Body() dto: MoveTokenDto,
    @AuthUserId() userId: string,
  ): Promise<void> {
    await this.mapLevelFinder.checkGmOwnership(campaignId, userId);

    await this.commandBus.execute(
      new MoveTokenCommand(campaignId, tokenId, dto.x, dto.y),
    );
  }
}
