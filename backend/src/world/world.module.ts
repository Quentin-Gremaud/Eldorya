import { Module } from '@nestjs/common';
import { MapDomainModule } from './map/map.module.js';
import { TokenDomainModule } from './token/token.module.js';
import { FogStateDomainModule } from './fog-state/fog-state.module.js';

@Module({
  imports: [MapDomainModule, TokenDomainModule, FogStateDomainModule],
})
export class WorldModule {}
