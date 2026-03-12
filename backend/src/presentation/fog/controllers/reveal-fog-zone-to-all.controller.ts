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
import { RevealFogZoneToAllCommand } from '../../../world/fog-state/commands/reveal-fog-zone-to-all.command.js';
import { FogStateFinder } from '../finders/fog-state.finder.js';
import { RevealFogZoneToAllDto } from '../dto/reveal-fog-zone-to-all.dto.js';
import { AuthUserId } from '../../../infrastructure/auth/auth-user-id.decorator.js';

@Controller('campaigns')
export class RevealFogZoneToAllController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly fogStateFinder: FogStateFinder,
  ) {}

  @Post(':campaignId/fog/reveal-all')
  @HttpCode(202)
  @UsePipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  )
  async handle(
    @Param('campaignId', new ParseUUIDPipe()) campaignId: string,
    @Body() dto: RevealFogZoneToAllDto,
    @AuthUserId() userId: string,
  ): Promise<void> {
    await this.fogStateFinder.checkGmAccess(campaignId, userId);

    await this.commandBus.execute(
      new RevealFogZoneToAllCommand(
        campaignId,
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
