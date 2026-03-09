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
import { RenameMapLevelDto } from '../dto/rename-map-level.dto.js';
import { RenameMapLevelCommand } from '../../../world/map/commands/rename-map-level.command.js';
import { MapLevelFinder } from '../finders/map-level.finder.js';

@Controller('campaigns')
export class RenameAMapLevelController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly mapLevelFinder: MapLevelFinder,
  ) {}

  @Put(':campaignId/map-levels/:mapLevelId/rename')
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
    @Body() dto: RenameMapLevelDto,
    @AuthUserId() userId: string,
  ): Promise<void> {
    await this.mapLevelFinder.checkGmOwnership(campaignId, userId);

    await this.commandBus.execute(
      new RenameMapLevelCommand(campaignId, mapLevelId, dto.name),
    );
  }
}
