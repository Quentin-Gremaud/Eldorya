import type { MapAggregate } from './map.aggregate.js';

export interface MapRepository {
  saveNew(map: MapAggregate): Promise<void>;
  save(map: MapAggregate): Promise<void>;
  load(campaignId: string): Promise<MapAggregate>;
}

export const MAP_REPOSITORY = 'MAP_REPOSITORY';
