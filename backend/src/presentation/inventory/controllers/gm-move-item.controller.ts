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
import { MoveItemDto } from '../dto/move-item.dto.js';
import { MoveItemCommand } from '../../../character/inventory/commands/move-item.command.js';
import { EmitInventoryModifiedByGmCommand } from '../../../character/inventory/commands/emit-inventory-modified-by-gm.command.js';
import { InventoryGmFinder } from '../finders/inventory-gm.finder.js';

@Controller('campaigns')
export class GmMoveItemController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly inventoryGmFinder: InventoryGmFinder,
  ) {}

  @Post(':campaignId/characters/:characterId/inventory/move')
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
    @Body() dto: MoveItemDto,
    @AuthUserId() userId: string,
  ): Promise<void> {
    await this.inventoryGmFinder.verifyGmOwnership(characterId, campaignId, userId);

    await this.commandBus.execute(
      new MoveItemCommand(characterId, dto.itemId, dto.toPosition, userId),
    );

    await this.commandBus.execute(
      new EmitInventoryModifiedByGmCommand(
        characterId,
        userId,
        'move-item',
        dto.itemId,
        { toPosition: dto.toPosition },
      ),
    );
  }
}
