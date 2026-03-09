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
import { DropItemDto } from '../dto/drop-item.dto.js';
import { DropItemCommand } from '../../../character/inventory/commands/drop-item.command.js';
import { InventoryFinder } from '../finders/inventory.finder.js';

@Controller('campaigns')
export class DropItemController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly inventoryFinder: InventoryFinder,
  ) {}

  @Post(':campaignId/characters/:characterId/inventory/drop')
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
    @Body() dto: DropItemDto,
    @AuthUserId() userId: string,
  ): Promise<void> {
    await this.inventoryFinder.verifyCharacterOwnership(characterId, userId, campaignId);

    await this.commandBus.execute(
      new DropItemCommand(characterId, dto.itemId, userId),
    );
  }
}
