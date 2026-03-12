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
import { HideFogZoneToAllCommand } from '../../../world/fog-state/commands/hide-fog-zone-to-all.command.js';
import { FogStateFinder } from '../finders/fog-state.finder.js';
import { HideFogZoneToAllDto } from '../dto/hide-fog-zone-to-all.dto.js';
import { AuthUserId } from '../../../infrastructure/auth/auth-user-id.decorator.js';

@Controller('campaigns')
export class HideFogZoneToAllController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly fogStateFinder: FogStateFinder,
  ) {}

  @Post(':campaignId/fog/hide-all')
  @HttpCode(202)
  @UsePipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  )
  async handle(
    @Param('campaignId', new ParseUUIDPipe()) campaignId: string,
    @Body() dto: HideFogZoneToAllDto,
    @AuthUserId() userId: string,
  ): Promise<void> {
    await this.fogStateFinder.checkGmAccess(campaignId, userId);

    await this.commandBus.execute(
      new HideFogZoneToAllCommand(
        campaignId,
        dto.fogZoneId,
      ),
    );
  }
}
