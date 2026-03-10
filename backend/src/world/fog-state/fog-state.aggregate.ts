import { FogStateInitialized } from './events/fog-state-initialized.event.js';
import { FogZoneRevealed } from './events/fog-zone-revealed.event.js';
import { FogZoneHidden } from './events/fog-zone-hidden.event.js';
import { FogZone } from './fog-zone.js';
import { FogStateId } from './fog-state-id.js';
import { FogStateAlreadyInitializedException } from './exceptions/fog-state-already-initialized.exception.js';
import { FogZoneAlreadyRevealedException } from './exceptions/fog-zone-already-revealed.exception.js';
import { FogZoneNotFoundException } from './exceptions/fog-zone-not-found.exception.js';
import { FogStateNotInitializedException } from './exceptions/fog-state-not-initialized.exception.js';
import type { Clock } from '../../shared/clock.js';

export type FogStateEvent = FogStateInitialized | FogZoneRevealed | FogZoneHidden;

interface FogZoneState {
  id: string;
  mapLevelId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export class FogStateAggregate {
  private campaignId = '';
  private playerId = '';
  private initialized = false;
  private revealedZones: Map<string, FogZoneState> = new Map();
  private uncommittedEvents: FogStateEvent[] = [];
  private _isNew = false;

  private constructor() {}

  static initialize(
    campaignId: string,
    playerId: string,
    clock: Clock,
  ): FogStateAggregate {
    const id = FogStateId.fromParts(campaignId, playerId);
    const aggregate = new FogStateAggregate();
    aggregate._isNew = true;

    const event = new FogStateInitialized(
      id.getCampaignId(),
      id.getPlayerId(),
      clock.now().toISOString(),
    );

    aggregate.applyEvent(event);
    aggregate.uncommittedEvents.push(event);
    return aggregate;
  }

  revealZone(fogZone: FogZone, clock: Clock): void {
    if (!this.initialized) {
      throw FogStateNotInitializedException.forPlayer(this.campaignId, this.playerId);
    }

    if (this.revealedZones.has(fogZone.getId())) {
      throw FogZoneAlreadyRevealedException.forZone(fogZone.getId(), this.campaignId, this.playerId);
    }

    const event = new FogZoneRevealed(
      this.campaignId,
      this.playerId,
      fogZone.getId(),
      fogZone.getMapLevelId(),
      fogZone.getX(),
      fogZone.getY(),
      fogZone.getWidth(),
      fogZone.getHeight(),
      clock.now().toISOString(),
    );

    this.applyEvent(event);
    this.uncommittedEvents.push(event);
  }

  hideZone(fogZoneId: string, clock: Clock): void {
    if (!this.initialized) {
      throw FogStateNotInitializedException.forPlayer(this.campaignId, this.playerId);
    }

    if (!this.revealedZones.has(fogZoneId)) {
      throw FogZoneNotFoundException.forZone(fogZoneId, this.campaignId, this.playerId);
    }

    const zone = this.revealedZones.get(fogZoneId)!;

    const event = new FogZoneHidden(
      this.campaignId,
      this.playerId,
      fogZoneId,
      zone.mapLevelId,
      clock.now().toISOString(),
    );

    this.applyEvent(event);
    this.uncommittedEvents.push(event);
  }

  private applyEvent(event: FogStateEvent): void {
    if (event instanceof FogStateInitialized) {
      if (this.initialized) {
        throw FogStateAlreadyInitializedException.forPlayer(event.campaignId, event.playerId);
      }
      this.campaignId = event.campaignId;
      this.playerId = event.playerId;
      this.initialized = true;
    } else if (event instanceof FogZoneRevealed) {
      this.revealedZones.set(event.fogZoneId, {
        id: event.fogZoneId,
        mapLevelId: event.mapLevelId,
        x: event.x,
        y: event.y,
        width: event.width,
        height: event.height,
      });
    } else if (event instanceof FogZoneHidden) {
      this.revealedZones.delete(event.fogZoneId);
    }
  }

  static loadFromHistory(
    campaignId: string,
    playerId: string,
    events: { type: string; data: Record<string, unknown> }[],
  ): FogStateAggregate {
    const aggregate = new FogStateAggregate();
    aggregate.campaignId = campaignId;
    aggregate.playerId = playerId;

    for (const event of events) {
      if (event.type === 'FogStateInitialized') {
        const d = event.data;
        aggregate.applyEvent(
          new FogStateInitialized(
            aggregate.requireString(d, 'campaignId', event.type),
            aggregate.requireString(d, 'playerId', event.type),
            aggregate.requireString(d, 'initializedAt', event.type),
          ),
        );
      } else if (event.type === 'FogZoneRevealed') {
        const d = event.data;
        aggregate.applyEvent(
          new FogZoneRevealed(
            aggregate.requireString(d, 'campaignId', event.type),
            aggregate.requireString(d, 'playerId', event.type),
            aggregate.requireString(d, 'fogZoneId', event.type),
            aggregate.requireString(d, 'mapLevelId', event.type),
            aggregate.requireNumber(d, 'x', event.type),
            aggregate.requireNumber(d, 'y', event.type),
            aggregate.requireNumber(d, 'width', event.type),
            aggregate.requireNumber(d, 'height', event.type),
            aggregate.requireString(d, 'revealedAt', event.type),
          ),
        );
      } else if (event.type === 'FogZoneHidden') {
        const d = event.data;
        aggregate.applyEvent(
          new FogZoneHidden(
            aggregate.requireString(d, 'campaignId', event.type),
            aggregate.requireString(d, 'playerId', event.type),
            aggregate.requireString(d, 'fogZoneId', event.type),
            aggregate.requireString(d, 'mapLevelId', event.type),
            aggregate.requireString(d, 'hiddenAt', event.type),
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

  isInitialized(): boolean {
    return this.initialized;
  }

  getCampaignId(): string {
    return this.campaignId;
  }

  getPlayerId(): string {
    return this.playerId;
  }

  getRevealedZones(): Map<string, FogZoneState> {
    return new Map(this.revealedZones);
  }

  getUncommittedEvents(): FogStateEvent[] {
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

  private requireNumber(
    data: Record<string, unknown>,
    field: string,
    eventType: string,
  ): number {
    const value = data[field];
    if (typeof value !== 'number') {
      throw new Error(
        `Invalid event data: "${field}" must be a number in ${eventType}, got ${typeof value}`,
      );
    }
    return value;
  }
}
