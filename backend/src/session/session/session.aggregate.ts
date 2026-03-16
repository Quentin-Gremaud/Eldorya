import { SessionStarted } from './events/session-started.event.js';
import { SessionModeChanged } from './events/session-mode-changed.event.js';
import { SessionMode } from './session-mode.js';
import { SessionStatus } from './session-status.js';
import { SessionId } from '../../shared/session-id.js';
import { CampaignId } from '../../shared/campaign-id.js';
import { SessionNotActiveException } from './exceptions/session-not-active.exception.js';
import type { Clock } from '../../shared/clock.js';

export type SessionEvent = SessionStarted | SessionModeChanged;

export class SessionAggregate {
  private sessionId = '';
  private campaignId = '';
  private gmUserId = '';
  private mode: SessionMode = SessionMode.preparation();
  private status: SessionStatus = SessionStatus.active();
  private startedAt = '';
  private uncommittedEvents: SessionEvent[] = [];
  private _isNew = false;

  private constructor() {}

  static start(
    sessionId: string,
    campaignId: string,
    gmUserId: string,
    clock: Clock,
  ): SessionAggregate {
    SessionId.fromString(sessionId);
    CampaignId.fromString(campaignId);
    if (!gmUserId || !gmUserId.trim()) {
      throw new Error('GM user ID cannot be empty');
    }

    const aggregate = new SessionAggregate();
    aggregate._isNew = true;

    const event = new SessionStarted(
      sessionId,
      campaignId,
      gmUserId,
      'preparation',
      clock.now().toISOString(),
    );

    aggregate.applyEvent(event);
    aggregate.uncommittedEvents.push(event);

    return aggregate;
  }

  changeMode(newMode: string, clock: Clock): void {
    if (!this.status.isActive()) {
      throw SessionNotActiveException.forSession(this.sessionId);
    }

    const targetMode = SessionMode.fromString(newMode);
    targetMode.ensureDifferentFrom(this.mode);

    const event = new SessionModeChanged(
      this.sessionId,
      this.campaignId,
      targetMode.toString(),
      clock.now().toISOString(),
    );

    this.applyEvent(event);
    this.uncommittedEvents.push(event);
  }

  private applyEvent(event: SessionEvent): void {
    if (event instanceof SessionStarted) {
      this.sessionId = event.sessionId;
      this.campaignId = event.campaignId;
      this.gmUserId = event.gmUserId;
      this.mode = SessionMode.fromPrimitives(event.mode);
      this.status = SessionStatus.active();
      this.startedAt = event.startedAt;
    } else if (event instanceof SessionModeChanged) {
      this.mode = SessionMode.fromPrimitives(event.newMode);
    } else {
      throw new Error(
        `Unexpected event type in applyEvent: ${(event as Record<string, unknown>).constructor?.name}`,
      );
    }
  }

  static loadFromHistory(
    sessionId: string,
    events: { type: string; data: Record<string, unknown> }[],
  ): SessionAggregate {
    const aggregate = new SessionAggregate();

    for (const event of events) {
      if (event.type === 'SessionStarted') {
        const d = event.data;
        aggregate.applyEvent(
          new SessionStarted(
            aggregate.requireString(d, 'sessionId', event.type),
            aggregate.requireString(d, 'campaignId', event.type),
            aggregate.requireString(d, 'gmUserId', event.type),
            aggregate.requireString(d, 'mode', event.type),
            aggregate.requireString(d, 'startedAt', event.type),
          ),
        );
      } else if (event.type === 'SessionModeChanged') {
        const d = event.data;
        aggregate.applyEvent(
          new SessionModeChanged(
            aggregate.requireString(d, 'sessionId', event.type),
            aggregate.requireString(d, 'campaignId', event.type),
            aggregate.requireString(d, 'newMode', event.type),
            aggregate.requireString(d, 'changedAt', event.type),
          ),
        );
      } else {
        throw new Error(`Unknown event type: ${event.type}`);
      }
    }

    return aggregate;
  }

  isNew(): boolean {
    return this._isNew;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  getCampaignId(): string {
    return this.campaignId;
  }

  getGmUserId(): string {
    return this.gmUserId;
  }

  getMode(): string {
    return this.mode.toString();
  }

  getStatus(): string {
    return this.status.toString();
  }

  getStartedAt(): string {
    return this.startedAt;
  }

  getUncommittedEvents(): SessionEvent[] {
    return [...this.uncommittedEvents];
  }

  clearEvents(): void {
    this.uncommittedEvents = [];
  }

  private requireString(
    data: Record<string, unknown>,
    field: string,
    eventType: string,
  ): string {
    const value = data[field];
    if (typeof value !== 'string') {
      throw new Error(
        `Invalid event data: "${field}" must be a string in ${eventType}, got ${typeof value}`,
      );
    }
    return value;
  }
}
