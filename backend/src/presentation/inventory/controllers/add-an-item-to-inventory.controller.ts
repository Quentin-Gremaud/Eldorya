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
import { AddItemToInventoryDto } from '../dto/add-item-to-inventory.dto.js';
import { AddItemToInventoryCommand } from '../../../character/inventory/commands/add-item-to-inventory.command.js';
import { InventoryGmFinder } from '../finders/inventory-gm.finder.js';

@Controller('campaigns')
export class AddAnItemToInventoryController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly inventoryGmFinder: InventoryGmFinder,
  ) {}

  @Post(':campaignId/characters/:characterId/inventory/add-item')
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
    @Body() dto: AddItemToInventoryDto,
    @AuthUserId() userId: string,
  ): Promise<void> {
    await this.inventoryGmFinder.verifyGmOwnership(characterId, campaignId, userId);

    const item = {
      id: dto.itemId,
      name: dto.name,
      description: dto.description ?? '',
      weight: dto.weight,
      slotType: dto.slotType,
      statModifiers: dto.statModifiers ?? {},
    };

    await this.commandBus.execute(
      new AddItemToInventoryCommand(characterId, item, userId),
    );
  }
}
