import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { InitializeFogStateHandler } from './commands/initialize-fog-state.handler.js';
import { RevealFogZoneHandler } from './commands/reveal-fog-zone.handler.js';
import { RevealFogZoneToAllHandler } from './commands/reveal-fog-zone-to-all.handler.js';
import { HideFogZoneHandler } from './commands/hide-fog-zone.handler.js';
import { HideFogZoneToAllHandler } from './commands/hide-fog-zone-to-all.handler.js';
import { KurrentDbFogStateRepository } from '../../infrastructure/world/kurrentdb-fog-state.repository.js';
import { FOG_STATE_REPOSITORY } from './fog-state.repository.js';
import { CAMPAIGN_PLAYER_PROVIDER } from './campaign-player.provider.js';
import { SystemClock, CLOCK } from '../../shared/clock.js';
import { FogStateFinder } from '../../presentation/fog/finders/fog-state.finder.js';
import { FogPresentationModule } from '../../presentation/fog/fog-presentation.module.js';

@Module({
  imports: [CqrsModule, FogPresentationModule],
  providers: [
    InitializeFogStateHandler,
    RevealFogZoneHandler,
    RevealFogZoneToAllHandler,
    HideFogZoneHandler,
    HideFogZoneToAllHandler,
    {
      provide: FOG_STATE_REPOSITORY,
      useClass: KurrentDbFogStateRepository,
    },
    {
      provide: CAMPAIGN_PLAYER_PROVIDER,
      useExisting: FogStateFinder,
    },
    { provide: CLOCK, useClass: SystemClock },
  ],
})
export class FogStateDomainModule {}
