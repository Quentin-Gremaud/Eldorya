import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CreateACharacterController } from './controllers/create-a-character.controller.js';
import { GetMyCharacterController } from './controllers/get-my-character.controller.js';
import { ListPendingCharactersController } from './controllers/list-pending-characters.controller.js';
import { ListCampaignCharactersController } from './controllers/list-campaign-characters.controller.js';
import { GetCharacterForGmController } from './controllers/get-character-for-gm.controller.js';
import { ApproveACharacterController } from './controllers/approve-a-character.controller.js';
import { RejectACharacterController } from './controllers/reject-a-character.controller.js';
import { ModifyCharacterByGmController } from './controllers/modify-character-by-gm.controller.js';
import { RequestACharacterModificationController } from './controllers/request-a-character-modification.controller.js';
import { ApproveCharacterModificationController } from './controllers/approve-character-modification.controller.js';
import { RejectCharacterModificationController } from './controllers/reject-character-modification.controller.js';
import { ListPendingModificationsController } from './controllers/list-pending-modifications.controller.js';
import { CharacterDetailFinder } from './finders/character-detail.finder.js';
import { PendingCharactersFinder } from './finders/pending-characters.finder.js';
import { CharacterForGmFinder } from './finders/character-for-gm.finder.js';
import { CampaignCharactersFinder } from './finders/campaign-characters.finder.js';
import { CharacterProjection } from './projections/character.projection.js';
import { CharacterOwnershipFinder } from './finders/character-ownership.finder.js';
import { PendingModificationsFinder } from './finders/pending-modifications.finder.js';
import { CampaignAnnouncementsFinder } from '../campaign/finders/campaign-announcements.finder.js';

@Module({
  imports: [CqrsModule],
  controllers: [
    // Route order matters: static routes before parameterized routes
    GetMyCharacterController,            // GET /characters/me
    ListPendingCharactersController,     // GET /characters/pending
    ListPendingModificationsController,  // GET /characters/pending-modifications
    ListCampaignCharactersController,    // GET /characters (list)
    CreateACharacterController,          // POST /characters
    GetCharacterForGmController,         // GET /characters/:characterId
    ApproveACharacterController,         // POST /characters/:characterId/approve
    RejectACharacterController,          // POST /characters/:characterId/reject
    ModifyCharacterByGmController,       // PATCH /characters/:characterId
    RequestACharacterModificationController, // POST /characters/:characterId/request-modification
    ApproveCharacterModificationController,  // POST /characters/:characterId/approve-modification
    RejectCharacterModificationController,   // POST /characters/:characterId/reject-modification
  ],
  providers: [
    CharacterDetailFinder,
    PendingCharactersFinder,
    CharacterForGmFinder,
    CampaignCharactersFinder,
    CharacterProjection,
    CharacterOwnershipFinder,
    PendingModificationsFinder,
    CampaignAnnouncementsFinder,
  ],
})
export class CharacterPresentationModule {}
