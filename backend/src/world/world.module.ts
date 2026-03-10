import { Module } from '@nestjs/common';
import { MapDomainModule } from './map/map.module.js';
import { TokenDomainModule } from './token/token.module.js';

@Module({
  imports: [MapDomainModule, TokenDomainModule],
})
export class WorldModule {}
