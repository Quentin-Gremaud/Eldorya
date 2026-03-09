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
import { ModifyMaxCapacityDto } from '../dto/modify-max-capacity.dto.js';
import { ModifyMaxCapacityCommand } from '../../../character/inventory/commands/modify-max-capacity.command.js';
import { InventoryGmFinder } from '../finders/inventory-gm.finder.js';

@Controller('campaigns')
export class ModifyMaxCapacityController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly inventoryGmFinder: InventoryGmFinder,
  ) {}

  @Post(':campaignId/characters/:characterId/inventory/modify-max-capacity')
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
    @Param('characterId', new ParseUUIDPipe()) characterId: string,
    @Body() dto: ModifyMaxCapacityDto,
    @AuthUserId() userId: string,
  ): Promise<void> {
    await this.inventoryGmFinder.verifyGmOwnership(
      characterId,
      campaignId,
      userId,
    );

    await this.commandBus.execute(
      new ModifyMaxCapacityCommand(
        characterId,
        dto.newMaxCapacity,
        userId,
      ),
    );
  }
}
