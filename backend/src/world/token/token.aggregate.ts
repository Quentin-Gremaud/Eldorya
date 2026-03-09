import { TokenPlaced } from './events/token-placed.event.js';
import { TokenMoved } from './events/token-moved.event.js';
import { TokenRemoved } from './events/token-removed.event.js';
import { TokenId } from './token-id.js';
import { TokenPosition } from './token-position.js';
import { TokenType } from './token-type.js';
import { TokenLabel } from './token-label.js';
import { TokenAlreadyExistsException } from './exceptions/token-already-exists.exception.js';
import { TokenNotFoundException } from './exceptions/token-not-found.exception.js';
import { MapLevelRequiredException } from './exceptions/map-level-required.exception.js';
import { CampaignId } from '../../shared/campaign-id.js';
import { MapLevelId } from '../map/map-level-id.js';
import type { Clock } from '../../shared/clock.js';

export type TokenEvent = TokenPlaced | TokenMoved | TokenRemoved;

interface TokenState {
  id: string;
  mapLevelId: string;
  x: number;
  y: number;
  tokenType: string;
  label: string;
}

export class TokenAggregate {
  private campaignId = '';
  private tokens: Map<string, TokenState> = new Map();
  private uncommittedEvents: TokenEvent[] = [];

  private constructor() {}

  static createNew(campaignId: string): TokenAggregate {
    const aggregate = new TokenAggregate();
    CampaignId.fromString(campaignId);
    aggregate.campaignId = campaignId;
    return aggregate;
  }

  placeToken(
    tokenId: string,
    mapLevelId: string,
    x: number,
    y: number,
    tokenType: string,
    label: string,
    clock: Clock,
  ): void {
    const id = TokenId.fromString(tokenId);
    if (!mapLevelId || !mapLevelId.trim()) {
      throw MapLevelRequiredException.forToken(this.campaignId);
    }
    MapLevelId.fromString(mapLevelId);
    const position = TokenPosition.create(x, y);
    const type = TokenType.fromString(tokenType);
    const tokenLabel = TokenLabel.create(label);

    if (this.tokens.has(id.toString())) {
      throw TokenAlreadyExistsException.forToken(id.toString(), this.campaignId);
    }

    const event = new TokenPlaced(
      this.campaignId,
      mapLevelId,
      id.toString(),
      position.getX(),
      position.getY(),
      type.toString(),
      tokenLabel.toString(),
      clock.now().toISOString(),
    );

    this.applyEvent(event);
    this.uncommittedEvents.push(event);
  }

  moveToken(
    tokenId: string,
    x: number,
    y: number,
    clock: Clock,
  ): void {
    const id = TokenId.fromString(tokenId);
    const position = TokenPosition.create(x, y);

    const token = this.tokens.get(id.toString());
    if (!token) {
      throw TokenNotFoundException.forToken(id.toString(), this.campaignId);
    }

    const event = new TokenMoved(
      this.campaignId,
      token.mapLevelId,
      id.toString(),
      position.getX(),
      position.getY(),
      clock.now().toISOString(),
    );

    this.applyEvent(event);
    this.uncommittedEvents.push(event);
  }

  removeToken(
    tokenId: string,
    clock: Clock,
  ): void {
    const id = TokenId.fromString(tokenId);

    const token = this.tokens.get(id.toString());
    if (!token) {
      throw TokenNotFoundException.forToken(id.toString(), this.campaignId);
    }

    const event = new TokenRemoved(
      this.campaignId,
      token.mapLevelId,
      id.toString(),
      clock.now().toISOString(),
    );

    this.applyEvent(event);
    this.uncommittedEvents.push(event);
  }

  private applyEvent(event: TokenEvent): void {
    if (event instanceof TokenPlaced) {
      this.campaignId = event.campaignId;
      this.tokens.set(event.tokenId, {
        id: event.tokenId,
        mapLevelId: event.mapLevelId,
        x: event.x,
        y: event.y,
        tokenType: event.tokenType,
        label: event.label,
      });
    } else if (event instanceof TokenMoved) {
      const token = this.tokens.get(event.tokenId);
      if (!token) {
        throw new Error(`Corrupted event stream: token '${event.tokenId}' not found during move`);
      }
      this.tokens.set(event.tokenId, {
        ...token,
        x: event.x,
        y: event.y,
      });
    } else if (event instanceof TokenRemoved) {
      this.tokens.delete(event.tokenId);
    } else {
      throw new Error(`Unexpected event type in applyEvent: ${(event as Record<string, unknown>).constructor?.name}`);
    }
  }

  static loadFromHistory(
    campaignId: string,
    events: { type: string; data: Record<string, unknown> }[],
  ): TokenAggregate {
    const aggregate = new TokenAggregate();
    aggregate.campaignId = campaignId;

    for (const event of events) {
      if (event.type === 'TokenPlaced') {
        const d = event.data;
        TokenPosition.fromPrimitives(
          aggregate.requireNumber(d, 'x', event.type),
          aggregate.requireNumber(d, 'y', event.type),
        );
        TokenType.fromPrimitives(aggregate.requireString(d, 'tokenType', event.type));
        TokenLabel.fromPrimitives(aggregate.requireString(d, 'label', event.type));
        TokenId.fromPrimitives(aggregate.requireString(d, 'tokenId', event.type));
        aggregate.applyEvent(
          new TokenPlaced(
            aggregate.requireString(d, 'campaignId', event.type),
            aggregate.requireString(d, 'mapLevelId', event.type),
            aggregate.requireString(d, 'tokenId', event.type),
            aggregate.requireNumber(d, 'x', event.type),
            aggregate.requireNumber(d, 'y', event.type),
            aggregate.requireString(d, 'tokenType', event.type),
            aggregate.requireString(d, 'label', event.type),
            aggregate.requireString(d, 'placedAt', event.type),
          ),
        );
      } else if (event.type === 'TokenMoved') {
        const d = event.data;
        TokenId.fromPrimitives(aggregate.requireString(d, 'tokenId', event.type));
        TokenPosition.fromPrimitives(
          aggregate.requireNumber(d, 'x', event.type),
          aggregate.requireNumber(d, 'y', event.type),
        );
        aggregate.applyEvent(
          new TokenMoved(
            aggregate.requireString(d, 'campaignId', event.type),
            aggregate.requireString(d, 'mapLevelId', event.type),
            aggregate.requireString(d, 'tokenId', event.type),
            aggregate.requireNumber(d, 'x', event.type),
            aggregate.requireNumber(d, 'y', event.type),
            aggregate.requireString(d, 'movedAt', event.type),
          ),
        );
      } else if (event.type === 'TokenRemoved') {
        const d = event.data;
        TokenId.fromPrimitives(aggregate.requireString(d, 'tokenId', event.type));
        aggregate.applyEvent(
          new TokenRemoved(
            aggregate.requireString(d, 'campaignId', event.type),
            aggregate.requireString(d, 'mapLevelId', event.type),
            aggregate.requireString(d, 'tokenId', event.type),
            aggregate.requireString(d, 'removedAt', event.type),
          ),
        );
      } else {
        throw new Error(`Unknown event type: ${event.type}`);
      }
    }
    return aggregate;
  }

  getUncommittedEvents(): TokenEvent[] {
    return [...this.uncommittedEvents];
  }

  clearEvents(): void {
    this.uncommittedEvents = [];
  }

  getCampaignId(): string {
    return this.campaignId;
  }

  getTokens(): Map<string, TokenState> {
    return new Map(this.tokens);
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
