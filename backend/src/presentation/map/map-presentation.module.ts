import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CreateAMapLevelController } from './controllers/create-a-map-level.controller.js';
import { RenameAMapLevelController } from './controllers/rename-a-map-level.controller.js';
import { GetMapLevelsController } from './controllers/get-map-levels.controller.js';
import { RequestMapBackgroundUploadController } from './controllers/request-map-background-upload.controller.js';
import { SetAMapBackgroundController } from './controllers/set-a-map-background.controller.js';
import { MapLevelFinder } from './finders/map-level.finder.js';
import { MapLevelQueryFinder } from './finders/map-level-query.finder.js';
import { MapLevelProjection } from './projections/map-level.projection.js';

@Module({
  imports: [CqrsModule],
  controllers: [
    GetMapLevelsController,         // GET /campaigns/:campaignId/map-levels
    CreateAMapLevelController,      // POST /campaigns/:campaignId/map-levels
    RenameAMapLevelController,      // PUT /campaigns/:campaignId/map-levels/:mapLevelId/rename
    RequestMapBackgroundUploadController, // POST /campaigns/:campaignId/map-levels/:mapLevelId/background/upload-url
    SetAMapBackgroundController,    // PUT /campaigns/:campaignId/map-levels/:mapLevelId/background
  ],
  providers: [
    MapLevelFinder,
    MapLevelQueryFinder,
    MapLevelProjection,
  ],
})
export class MapPresentationModule {}
