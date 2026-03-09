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
import { EquipItemDto } from '../dto/equip-item.dto.js';
import { EquipItemCommand } from '../../../character/inventory/commands/equip-item.command.js';
import { EmitInventoryModifiedByGmCommand } from '../../../character/inventory/commands/emit-inventory-modified-by-gm.command.js';
import { InventoryGmFinder } from '../finders/inventory-gm.finder.js';

@Controller('campaigns')
export class GmEquipItemController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly inventoryGmFinder: InventoryGmFinder,
  ) {}

  @Post(':campaignId/characters/:characterId/inventory/equip')
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
    @Body() dto: EquipItemDto,
    @AuthUserId() userId: string,
  ): Promise<void> {
    await this.inventoryGmFinder.verifyGmOwnership(characterId, campaignId, userId);

    await this.commandBus.execute(
      new EquipItemCommand(characterId, dto.itemId, dto.slotType, userId),
    );

    await this.commandBus.execute(
      new EmitInventoryModifiedByGmCommand(
        characterId,
        userId,
        'equip-item',
        dto.itemId,
        { slotType: dto.slotType },
      ),
    );
  }
}
