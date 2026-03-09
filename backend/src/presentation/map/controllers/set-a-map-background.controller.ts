import {
  Controller,
  Put,
  Body,
  Param,
  UsePipes,
  ValidationPipe,
  HttpCode,
  ParseUUIDPipe,
  NotFoundException,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { AuthUserId } from '../../../infrastructure/auth/auth-user-id.decorator.js';
import { SetMapBackgroundDto } from '../dto/set-map-background.dto.js';
import { SetMapBackgroundCommand } from '../../../world/map/commands/set-map-background.command.js';
import { MapLevelFinder } from '../finders/map-level.finder.js';
import { MapLevelQueryFinder } from '../finders/map-level-query.finder.js';

@Controller('campaigns')
export class SetAMapBackgroundController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly mapLevelFinder: MapLevelFinder,
    private readonly mapLevelQueryFinder: MapLevelQueryFinder,
  ) {}

  @Put(':campaignId/map-levels/:mapLevelId/background')
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
    @Param('mapLevelId', new ParseUUIDPipe()) mapLevelId: string,
    @Body() dto: SetMapBackgroundDto,
    @AuthUserId() userId: string,
  ): Promise<void> {
    await this.mapLevelFinder.checkGmOwnership(campaignId, userId);

    const levels = await this.mapLevelQueryFinder.findByCampaignId(campaignId);
    const levelExists = levels.some((l) => l.id === mapLevelId);
    if (!levelExists) {
      throw new NotFoundException('Map level not found');
    }

    await this.commandBus.execute(
      new SetMapBackgroundCommand(
        campaignId,
        mapLevelId,
        dto.backgroundImageUrl,
      ),
    );
  }
}
