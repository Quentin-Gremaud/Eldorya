import { Injectable, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { ActionPipelineRepository } from '../../session/action-pipeline/action-pipeline.repository.js';
import {
  ActionPipelineAggregate,
  type ActionPipelineEvent,
} from '../../session/action-pipeline/action-pipeline.aggregate.js';
import { PlayerPinged } from '../../session/action-pipeline/events/player-pinged.event.js';
import { ActionProposed } from '../../session/action-pipeline/events/action-proposed.event.js';
import { KurrentDbService } from '../eventstore/kurrentdb.service.js';
import type { Clock } from '../../shared/clock.js';
import { CLOCK } from '../../shared/clock.js';

@Injectable()
export class KurrentDbActionPipelineRepository implements ActionPipelineRepository {
  constructor(
    private readonly kurrentDb: KurrentDbService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async saveNew(aggregate: ActionPipelineAggregate): Promise<void> {
    const streamName = `action-pipeline-${aggregate.getSessionId()}`;
    const allEvents = this.toMappedEvents(aggregate);

    await this.kurrentDb.appendEventsToNewStream(streamName, allEvents);

    aggregate.clearEvents();
  }

  async save(aggregate: ActionPipelineAggregate): Promise<void> {
    const streamName = `action-pipeline-${aggregate.getSessionId()}`;
    const allEvents = this.toMappedEvents(aggregate);

    await this.kurrentDb.appendEventsToStream(streamName, allEvents);

    aggregate.clearEvents();
  }

  async load(sessionId: string): Promise<ActionPipelineAggregate> {
    const events = await this.kurrentDb.readStream(`action-pipeline-${sessionId}`);
    return ActionPipelineAggregate.loadFromHistory(sessionId, events);
  }

  async loadOrCreate(
    sessionId: string,
    campaignId: string,
  ): Promise<ActionPipelineAggregate> {
    try {
      return await this.load(sessionId);
    } catch (error: unknown) {
      if (error instanceof Error && error.message.toLowerCase().replace(/\s/g, '').includes('notfound')) {
        return ActionPipelineAggregate.create(sessionId, campaignId);
      }
      throw error;
    }
  }

  private toMappedEvents(aggregate: ActionPipelineAggregate) {
    const sessionId = aggregate.getSessionId();
    const campaignId = aggregate.getCampaignId();
    const correlationId = randomUUID();

    return aggregate.getUncommittedEvents().map((event) => ({
      eventType: event.type,
      data: this.toEventData(event),
      metadata: {
        correlationId,
        timestamp: this.clock.now().toISOString(),
        sessionId,
        campaignId,
      },
    }));
  }

  private toEventData(event: ActionPipelineEvent): Record<string, unknown> {
    if (event instanceof PlayerPinged) {
      return {
        sessionId: event.sessionId,
        campaignId: event.campaignId,
        playerId: event.playerId,
        gmUserId: event.gmUserId,
        pingedAt: event.pingedAt,
      };
    }
    if (event instanceof ActionProposed) {
      return {
        actionId: event.actionId,
        sessionId: event.sessionId,
        campaignId: event.campaignId,
        playerId: event.playerId,
        actionType: event.actionType,
        description: event.description,
        target: event.target,
        proposedAt: event.proposedAt,
      };
    }
    const _exhaustive: never = event;
    throw new Error('Unknown action pipeline event type');
  }
}
