import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { GetPlayerFogStateController } from './controllers/get-player-fog-state.controller.js';
import { RevealFogZoneController } from './controllers/reveal-fog-zone.controller.js';
import { RevealFogZoneToAllController } from './controllers/reveal-fog-zone-to-all.controller.js';
import { FogStateFinder } from './finders/fog-state.finder.js';
import { FogStateProjection } from './projections/fog-state.projection.js';

@Module({
  imports: [CqrsModule],
  controllers: [
    GetPlayerFogStateController, // GET /campaigns/:campaignId/maps/:mapLevelId/fog?playerId=xxx
    RevealFogZoneController,        // POST /campaigns/:campaignId/fog/reveal
    RevealFogZoneToAllController,   // POST /campaigns/:campaignId/fog/reveal-all
  ],
  providers: [
    FogStateFinder,
    FogStateProjection,
  ],
  exports: [FogStateFinder],
})
export class FogPresentationModule {}
