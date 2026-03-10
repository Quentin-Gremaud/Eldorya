import { Injectable, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { MapRepository } from '../../world/map/map.repository.js';
import { MapAggregate, type MapEvent } from '../../world/map/map.aggregate.js';
import { MapLevelCreated } from '../../world/map/events/map-level-created.event.js';
import { MapLevelRenamed } from '../../world/map/events/map-level-renamed.event.js';
import { MapLevelBackgroundSet } from '../../world/map/events/map-level-background-set.event.js';
import { KurrentDbService } from '../eventstore/kurrentdb.service.js';
import type { Clock } from '../../shared/clock.js';
import { CLOCK } from '../../shared/clock.js';

@Injectable()
export class KurrentDbMapRepository implements MapRepository {
  constructor(
    private readonly kurrentDb: KurrentDbService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async saveNew(map: MapAggregate): Promise<void> {
    const campaignId = map.getCampaignId();
    const streamName = `map-${campaignId}`;
    const events = map.getUncommittedEvents();
    const correlationId = randomUUID();

    const allEvents = events.map((event) => ({
      eventType: event.type,
      data: this.toEventData(event),
      metadata: {
        correlationId,
        timestamp: this.clock.now().toISOString(),
        campaignId,
      },
    }));

    await this.kurrentDb.appendEventsToNewStream(streamName, allEvents);

    map.clearEvents();
  }

  async save(map: MapAggregate): Promise<void> {
    const campaignId = map.getCampaignId();
    const streamName = `map-${campaignId}`;
    const events = map.getUncommittedEvents();
    const correlationId = randomUUID();

    const allEvents = events.map((event) => ({
      eventType: event.type,
      data: this.toEventData(event),
      metadata: {
        correlationId,
        timestamp: this.clock.now().toISOString(),
        campaignId,
      },
    }));

    await this.kurrentDb.appendEventsToStream(streamName, allEvents);

    map.clearEvents();
  }

  async load(campaignId: string): Promise<MapAggregate> {
    try {
      const events = await this.kurrentDb.readStream(`map-${campaignId}`);
      return MapAggregate.loadFromHistory(campaignId, events);
    } catch (error: unknown) {
      if (error instanceof Error && error.message.toLowerCase().replace(/\s/g, '').includes('notfound')) {
        return MapAggregate.createNew(campaignId);
      }
      throw error;
    }
  }

  private toEventData(event: MapEvent): Record<string, unknown> {
    if (event instanceof MapLevelCreated) {
      return {
        campaignId: event.campaignId,
        mapLevelId: event.mapLevelId,
        name: event.name,
        parentId: event.parentId,
        depth: event.depth,
        createdAt: event.createdAt,
      };
    }
    if (event instanceof MapLevelRenamed) {
      return {
        campaignId: event.campaignId,
        mapLevelId: event.mapLevelId,
        newName: event.newName,
        renamedAt: event.renamedAt,
      };
    }
    if (event instanceof MapLevelBackgroundSet) {
      return {
        campaignId: event.campaignId,
        mapLevelId: event.mapLevelId,
        backgroundImageUrl: event.backgroundImageUrl,
        previousBackgroundImageUrl: event.previousBackgroundImageUrl,
        setAt: event.setAt,
      };
    }
    const _exhaustive: never = event;
    throw new Error('Unknown map event type');
  }
}
