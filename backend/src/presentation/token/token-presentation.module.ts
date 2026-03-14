import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PlaceATokenController } from './controllers/place-a-token.controller.js';
import { MoveATokenController } from './controllers/move-a-token.controller.js';
import { RemoveATokenController } from './controllers/remove-a-token.controller.js';
import { GetTokensController } from './controllers/get-tokens.controller.js';
import { LinkALocationTokenController } from './controllers/link-a-location-token.controller.js';
import { TokenFinder } from './finders/token.finder.js';
import { TokenProjection } from './projections/token.projection.js';
import { MapPresentationModule } from '../map/map-presentation.module.js';

@Module({
  imports: [CqrsModule, MapPresentationModule],
  controllers: [
    GetTokensController,        // GET /campaigns/:campaignId/tokens?mapLevelId=:id
    PlaceATokenController,      // POST /campaigns/:campaignId/tokens
    MoveATokenController,       // PUT /campaigns/:campaignId/tokens/:tokenId/position
    RemoveATokenController,     // DELETE /campaigns/:campaignId/tokens/:tokenId
    LinkALocationTokenController, // PUT /campaigns/:campaignId/tokens/:tokenId/destination
  ],
  providers: [
    TokenFinder,
    TokenProjection,
  ],
})
export class TokenPresentationModule {}
