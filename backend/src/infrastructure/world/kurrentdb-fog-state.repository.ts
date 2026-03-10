import { Injectable, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { FogStateRepository } from '../../world/fog-state/fog-state.repository.js';
import { FogStateAggregate, type FogStateEvent } from '../../world/fog-state/fog-state.aggregate.js';
import { FogStateInitialized } from '../../world/fog-state/events/fog-state-initialized.event.js';
import { FogZoneRevealed } from '../../world/fog-state/events/fog-zone-revealed.event.js';
import { FogZoneHidden } from '../../world/fog-state/events/fog-zone-hidden.event.js';
import { KurrentDbService } from '../eventstore/kurrentdb.service.js';
import type { Clock } from '../../shared/clock.js';
import { CLOCK } from '../../shared/clock.js';

@Injectable()
export class KurrentDbFogStateRepository implements FogStateRepository {
  constructor(
    private readonly kurrentDb: KurrentDbService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async saveNew(fogState: FogStateAggregate): Promise<void> {
    const campaignId = fogState.getCampaignId();
    const playerId = fogState.getPlayerId();
    const streamName = `fog-${campaignId}-${playerId}`;
    const events = fogState.getUncommittedEvents();
    const correlationId = randomUUID();

    const allEvents = events.map((event) => ({
      eventType: event.type,
      data: this.toEventData(event),
      metadata: {
        correlationId,
        timestamp: this.clock.now().toISOString(),
        campaignId,
        playerId,
      },
    }));

    await this.kurrentDb.appendEventsToNewStream(streamName, allEvents);

    fogState.clearEvents();
  }

  async save(fogState: FogStateAggregate): Promise<void> {
    const campaignId = fogState.getCampaignId();
    const playerId = fogState.getPlayerId();
    const streamName = `fog-${campaignId}-${playerId}`;
    const events = fogState.getUncommittedEvents();
    const correlationId = randomUUID();

    const allEvents = events.map((event) => ({
      eventType: event.type,
      data: this.toEventData(event),
      metadata: {
        correlationId,
        timestamp: this.clock.now().toISOString(),
        campaignId,
        playerId,
      },
    }));

    await this.kurrentDb.appendEventsToStream(streamName, allEvents);

    fogState.clearEvents();
  }

  async load(campaignId: string, playerId: string): Promise<FogStateAggregate> {
    const events = await this.kurrentDb.readStream(`fog-${campaignId}-${playerId}`);
    return FogStateAggregate.loadFromHistory(campaignId, playerId, events);
  }

  private toEventData(event: FogStateEvent): Record<string, unknown> {
    if (event instanceof FogStateInitialized) {
      return {
        campaignId: event.campaignId,
        playerId: event.playerId,
        initializedAt: event.initializedAt,
      };
    }
    if (event instanceof FogZoneRevealed) {
      return {
        campaignId: event.campaignId,
        playerId: event.playerId,
        fogZoneId: event.fogZoneId,
        mapLevelId: event.mapLevelId,
        x: event.x,
        y: event.y,
        width: event.width,
        height: event.height,
        revealedAt: event.revealedAt,
      };
    }
    if (event instanceof FogZoneHidden) {
      return {
        campaignId: event.campaignId,
        playerId: event.playerId,
        fogZoneId: event.fogZoneId,
        mapLevelId: event.mapLevelId,
        hiddenAt: event.hiddenAt,
      };
    }
    const _exhaustive: never = event;
    throw new Error('Unknown fog state event type');
  }
}
