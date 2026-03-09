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
import { CreateMapLevelDto } from '../dto/create-map-level.dto.js';
import { CreateMapLevelCommand } from '../../../world/map/commands/create-map-level.command.js';
import { MapLevelFinder } from '../finders/map-level.finder.js';

@Controller('campaigns')
export class CreateAMapLevelController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly mapLevelFinder: MapLevelFinder,
  ) {}

  @Post(':campaignId/map-levels')
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
    @Body() dto: CreateMapLevelDto,
    @AuthUserId() userId: string,
  ): Promise<void> {
    await this.mapLevelFinder.checkGmOwnership(campaignId, userId);

    await this.commandBus.execute(
      new CreateMapLevelCommand(
        campaignId,
        dto.mapLevelId,
        dto.name,
        dto.parentId ?? null,
      ),
    );
  }
}
