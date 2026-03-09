import { Module } from '@nestjs/common';
import { MapDomainModule } from './map/map.module.js';

@Module({
  imports: [MapDomainModule],
})
export class WorldModule {}
