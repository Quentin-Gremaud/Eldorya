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
import { HideFogZoneCommand } from '../../../world/fog-state/commands/hide-fog-zone.command.js';
import { FogStateFinder } from '../finders/fog-state.finder.js';
import { HideFogZoneDto } from '../dto/hide-fog-zone.dto.js';
import { AuthUserId } from '../../../infrastructure/auth/auth-user-id.decorator.js';

@Controller('campaigns')
export class HideFogZoneController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly fogStateFinder: FogStateFinder,
  ) {}

  @Post(':campaignId/fog/hide')
  @HttpCode(202)
  @UsePipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  )
  async handle(
    @Param('campaignId', new ParseUUIDPipe()) campaignId: string,
    @Body() dto: HideFogZoneDto,
    @AuthUserId() userId: string,
  ): Promise<void> {
    await this.fogStateFinder.checkGmAccess(campaignId, userId);
    await this.fogStateFinder.checkPlayerInCampaign(campaignId, dto.playerId);

    await this.commandBus.execute(
      new HideFogZoneCommand(
        campaignId,
        dto.playerId,
        dto.fogZoneId,
      ),
    );
  }
}
