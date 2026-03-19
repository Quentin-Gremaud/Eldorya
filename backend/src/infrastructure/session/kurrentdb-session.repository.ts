import { Injectable, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { SessionRepository } from '../../session/session/session.repository.js';
import { SessionAggregate, type SessionEvent } from '../../session/session/session.aggregate.js';
import { SessionStarted } from '../../session/session/events/session-started.event.js';
import { SessionModeChanged } from '../../session/session/events/session-mode-changed.event.js';
import { PipelineModeChanged } from '../../session/session/events/pipeline-mode-changed.event.js';
import { KurrentDbService } from '../eventstore/kurrentdb.service.js';
import type { Clock } from '../../shared/clock.js';
import { CLOCK } from '../../shared/clock.js';

@Injectable()
export class KurrentDbSessionRepository implements SessionRepository {
  constructor(
    private readonly kurrentDb: KurrentDbService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async saveNew(aggregate: SessionAggregate): Promise<void> {
    const sessionId = aggregate.getSessionId();
    const streamName = `session-${sessionId}`;
    const events = aggregate.getUncommittedEvents();
    const correlationId = randomUUID();

    const allEvents = events.map((event) => ({
      eventType: event.type,
      data: this.toEventData(event),
      metadata: {
        correlationId,
        timestamp: this.clock.now().toISOString(),
        sessionId,
        campaignId: aggregate.getCampaignId(),
      },
    }));

    await this.kurrentDb.appendEventsToNewStream(streamName, allEvents);

    aggregate.clearEvents();
  }

  async save(aggregate: SessionAggregate): Promise<void> {
    const sessionId = aggregate.getSessionId();
    const streamName = `session-${sessionId}`;
    const events = aggregate.getUncommittedEvents();
    const correlationId = randomUUID();

    const allEvents = events.map((event) => ({
      eventType: event.type,
      data: this.toEventData(event),
      metadata: {
        correlationId,
        timestamp: this.clock.now().toISOString(),
        sessionId,
        campaignId: aggregate.getCampaignId(),
      },
    }));

    await this.kurrentDb.appendEventsToStream(streamName, allEvents);

    aggregate.clearEvents();
  }

  async load(sessionId: string): Promise<SessionAggregate> {
    const events = await this.kurrentDb.readStream(`session-${sessionId}`);
    return SessionAggregate.loadFromHistory(sessionId, events);
  }

  private toEventData(event: SessionEvent): Record<string, unknown> {
    if (event instanceof SessionStarted) {
      return {
        sessionId: event.sessionId,
        campaignId: event.campaignId,
        gmUserId: event.gmUserId,
        mode: event.mode,
        startedAt: event.startedAt,
      };
    }
    if (event instanceof SessionModeChanged) {
      return {
        sessionId: event.sessionId,
        campaignId: event.campaignId,
        newMode: event.newMode,
        changedAt: event.changedAt,
      };
    }
    if (event instanceof PipelineModeChanged) {
      return {
        sessionId: event.sessionId,
        campaignId: event.campaignId,
        gmUserId: event.gmUserId,
        pipelineMode: event.pipelineMode,
        changedAt: event.changedAt,
      };
    }
    const _exhaustive: never = event;
    throw new Error('Unknown session event type');
  }
}
