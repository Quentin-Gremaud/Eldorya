import { Module } from '@nestjs/common';
import { GetPlayerFogStateController } from './controllers/get-player-fog-state.controller.js';
import { FogStateFinder } from './finders/fog-state.finder.js';
import { FogStateProjection } from './projections/fog-state.projection.js';

@Module({
  controllers: [
    GetPlayerFogStateController, // GET /campaigns/:campaignId/maps/:mapLevelId/fog?playerId=xxx
  ],
  providers: [
    FogStateFinder,
    FogStateProjection,
  ],
  exports: [FogStateFinder],
})
export class FogPresentationModule {}
