import {
  Controller,
  Get,
  Param,
  NotFoundException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthUserId } from '../../../infrastructure/auth/auth-user-id.decorator.js';
import { InventoryFinder } from '../finders/inventory.finder.js';

@Controller('characters')
export class GetInventoryController {
  constructor(private readonly inventoryFinder: InventoryFinder) {}

  @Get(':characterId/inventory')
  async handle(
    @Param('characterId', new ParseUUIDPipe()) characterId: string,
    @AuthUserId() userId: string,
  ): Promise<{ data: unknown }> {
    const inventory = await this.inventoryFinder.findByCharacterId(
      characterId,
      userId,
    );

    if (!inventory) {
      throw new NotFoundException('Inventory not found for this character.');
    }

    return { data: inventory };
  }
}
