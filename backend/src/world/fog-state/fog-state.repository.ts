import type { FogStateAggregate } from './fog-state.aggregate.js';

export interface FogStateRepository {
  saveNew(fogState: FogStateAggregate): Promise<void>;
  save(fogState: FogStateAggregate): Promise<void>;
  load(campaignId: string, playerId: string): Promise<FogStateAggregate>;
}

export const FOG_STATE_REPOSITORY = 'FOG_STATE_REPOSITORY';
