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
import { RevealFogZoneCommand } from '../../../world/fog-state/commands/reveal-fog-zone.command.js';
import { FogStateFinder } from '../finders/fog-state.finder.js';
import { RevealFogZoneDto } from '../dto/reveal-fog-zone.dto.js';
import { AuthUserId } from '../../../infrastructure/auth/auth-user-id.decorator.js';

@Controller('campaigns')
export class RevealFogZoneController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly fogStateFinder: FogStateFinder,
  ) {}

  @Post(':campaignId/fog/reveal')
  @HttpCode(202)
  @UsePipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  )
  async handle(
    @Param('campaignId', new ParseUUIDPipe()) campaignId: string,
    @Body() dto: RevealFogZoneDto,
    @AuthUserId() userId: string,
  ): Promise<void> {
    await this.fogStateFinder.checkGmAccess(campaignId, userId);
    await this.fogStateFinder.checkPlayerInCampaign(campaignId, dto.playerId);

    await this.commandBus.execute(
      new RevealFogZoneCommand(
        campaignId,
        dto.playerId,
        dto.fogZoneId,
        dto.mapLevelId,
        dto.x,
        dto.y,
        dto.width,
        dto.height,
      ),
    );
  }
}
