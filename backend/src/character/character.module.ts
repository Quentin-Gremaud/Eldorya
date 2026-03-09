import { Module } from '@nestjs/common';
import { CharacterDomainModule } from './character/character.module.js';
import { InventoryDomainModule } from './inventory/inventory.module.js';

@Module({
  imports: [CharacterDomainModule, InventoryDomainModule],
})
export class CharacterModule {}
