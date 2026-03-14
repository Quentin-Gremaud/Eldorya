import { Injectable, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { TokenRepository } from '../../world/token/token.repository.js';
import { TokenAggregate, type TokenEvent } from '../../world/token/token.aggregate.js';
import { TokenPlaced } from '../../world/token/events/token-placed.event.js';
import { TokenMoved } from '../../world/token/events/token-moved.event.js';
import { TokenRemoved } from '../../world/token/events/token-removed.event.js';
import { LocationTokenLinked } from '../../world/token/events/location-token-linked.event.js';
import { KurrentDbService } from '../eventstore/kurrentdb.service.js';
import type { Clock } from '../../shared/clock.js';
import { CLOCK } from '../../shared/clock.js';

@Injectable()
export class KurrentDbTokenRepository implements TokenRepository {
  constructor(
    private readonly kurrentDb: KurrentDbService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async saveNew(aggregate: TokenAggregate): Promise<void> {
    const campaignId = aggregate.getCampaignId();
    const streamName = `token-${campaignId}`;
    const events = aggregate.getUncommittedEvents();
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

    aggregate.clearEvents();
  }

  async save(aggregate: TokenAggregate): Promise<void> {
    const campaignId = aggregate.getCampaignId();
    const streamName = `token-${campaignId}`;
    const events = aggregate.getUncommittedEvents();
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

    aggregate.clearEvents();
  }

  async load(campaignId: string): Promise<TokenAggregate> {
    try {
      const events = await this.kurrentDb.readStream(`token-${campaignId}`);
      return TokenAggregate.loadFromHistory(campaignId, events);
    } catch (error: unknown) {
      if (error instanceof Error && error.message.toLowerCase().replace(/\s/g, '').includes('notfound')) {
        return TokenAggregate.createNew(campaignId);
      }
      throw error;
    }
  }

  private toEventData(event: TokenEvent): Record<string, unknown> {
    if (event instanceof TokenPlaced) {
      return {
        campaignId: event.campaignId,
        mapLevelId: event.mapLevelId,
        tokenId: event.tokenId,
        x: event.x,
        y: event.y,
        tokenType: event.tokenType,
        label: event.label,
        placedAt: event.placedAt,
        ...(event.destinationMapLevelId !== undefined && {
          destinationMapLevelId: event.destinationMapLevelId,
        }),
      };
    }
    if (event instanceof TokenMoved) {
      return {
        campaignId: event.campaignId,
        mapLevelId: event.mapLevelId,
        tokenId: event.tokenId,
        x: event.x,
        y: event.y,
        movedAt: event.movedAt,
      };
    }
    if (event instanceof TokenRemoved) {
      return {
        campaignId: event.campaignId,
        mapLevelId: event.mapLevelId,
        tokenId: event.tokenId,
        removedAt: event.removedAt,
      };
    }
    if (event instanceof LocationTokenLinked) {
      return {
        campaignId: event.campaignId,
        tokenId: event.tokenId,
        destinationMapLevelId: event.destinationMapLevelId,
        linkedAt: event.linkedAt,
      };
    }
    const _exhaustive: never = event;
    throw new Error('Unknown token event type');
  }
}
