import {
  Controller,
  Post,
  Body,
  Param,
  UsePipes,
  ValidationPipe,
  HttpCode,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { AuthUserId } from '../../../infrastructure/auth/auth-user-id.decorator.js';
import { PlaceTokenDto } from '../dto/place-token.dto.js';
import { PlaceTokenCommand } from '../../../world/token/commands/place-token.command.js';
import { MapLevelFinder } from '../../map/finders/map-level.finder.js';

@Controller('campaigns')
export class PlaceATokenController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly mapLevelFinder: MapLevelFinder,
  ) {}

  @Post(':campaignId/tokens')
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
    @Body() dto: PlaceTokenDto,
    @AuthUserId() userId: string,
  ): Promise<void> {
    await this.mapLevelFinder.checkGmOwnership(campaignId, userId);
    await this.mapLevelFinder.checkMapLevelExists(campaignId, dto.mapLevelId);

    await this.commandBus.execute(
      new PlaceTokenCommand(
        campaignId,
        dto.tokenId,
        dto.mapLevelId,
        dto.x,
        dto.y,
        dto.tokenType,
        dto.label,
      ),
    );
  }
}
