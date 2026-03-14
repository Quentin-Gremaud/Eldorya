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
import { LinkLocationTokenDto } from '../dto/link-location-token.dto.js';
import { LinkLocationTokenCommand } from '../../../world/token/commands/link-location-token.command.js';
import { MapLevelFinder } from '../../map/finders/map-level.finder.js';

@Controller('campaigns')
export class LinkALocationTokenController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly mapLevelFinder: MapLevelFinder,
  ) {}

  @Put(':campaignId/tokens/:tokenId/destination')
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
    @Body() dto: LinkLocationTokenDto,
    @AuthUserId() userId: string,
  ): Promise<void> {
    await this.mapLevelFinder.checkGmOwnership(campaignId, userId);
    await this.mapLevelFinder.checkMapLevelExists(campaignId, dto.destinationMapLevelId);

    await this.commandBus.execute(
      new LinkLocationTokenCommand(
        campaignId,
        tokenId,
        dto.destinationMapLevelId,
      ),
    );
  }
}
