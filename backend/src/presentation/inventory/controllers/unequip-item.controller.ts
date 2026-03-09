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
import { UnequipItemDto } from '../dto/unequip-item.dto.js';
import { UnequipItemCommand } from '../../../character/inventory/commands/unequip-item.command.js';
import { InventoryFinder } from '../finders/inventory.finder.js';

@Controller('campaigns')
export class UnequipItemController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly inventoryFinder: InventoryFinder,
  ) {}

  @Post(':campaignId/characters/:characterId/inventory/unequip')
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
    @Body() dto: UnequipItemDto,
    @AuthUserId() userId: string,
  ): Promise<void> {
    await this.inventoryFinder.verifyCharacterOwnership(characterId, userId, campaignId);

    await this.commandBus.execute(
      new UnequipItemCommand(characterId, dto.itemId, userId),
    );
  }
}
