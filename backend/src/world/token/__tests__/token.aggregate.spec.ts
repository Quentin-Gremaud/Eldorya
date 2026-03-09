import { TokenAggregate } from '../token.aggregate.js';
import { TokenPlaced } from '../events/token-placed.event.js';
import { TokenMoved } from '../events/token-moved.event.js';
import { TokenRemoved } from '../events/token-removed.event.js';
import { TokenAlreadyExistsException } from '../exceptions/token-already-exists.exception.js';
import { TokenNotFoundException } from '../exceptions/token-not-found.exception.js';
import { InvalidTokenIdException } from '../exceptions/invalid-token-id.exception.js';
import { InvalidTokenPositionException } from '../exceptions/invalid-token-position.exception.js';
import { InvalidTokenTypeException } from '../exceptions/invalid-token-type.exception.js';
import { InvalidTokenLabelException } from '../exceptions/invalid-token-label.exception.js';
import { MapLevelRequiredException } from '../exceptions/map-level-required.exception.js';
import type { Clock } from '../../../shared/clock.js';

describe('TokenAggregate', () => {
  const campaignId = '550e8400-e29b-41d4-a716-446655440000';
  const mapLevelId = '660e8400-e29b-41d4-a716-446655440001';
  const tokenId1 = '770e8400-e29b-41d4-a716-446655440001';
  const tokenId2 = '770e8400-e29b-41d4-a716-446655440002';

  const fixedDate = new Date('2026-03-09T10:00:00.000Z');
  const clock: Clock = { now: () => fixedDate };

  describe('createNew', () => {
    it('should create a new empty token aggregate', () => {
      const aggregate = TokenAggregate.createNew(campaignId);
      expect(aggregate.getCampaignId()).toBe(campaignId);
      expect(aggregate.getTokens().size).toBe(0);
      expect(aggregate.getUncommittedEvents()).toHaveLength(0);
    });
  });

  describe('placeToken', () => {
    it('should place a token and emit TokenPlaced event', () => {
      const aggregate = TokenAggregate.createNew(campaignId);
      aggregate.placeToken(tokenId1, mapLevelId, 100, 200, 'player', 'Warrior', clock);

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(TokenPlaced);

      const event = events[0] as TokenPlaced;
      expect(event.campaignId).toBe(campaignId);
      expect(event.mapLevelId).toBe(mapLevelId);
      expect(event.tokenId).toBe(tokenId1);
      expect(event.x).toBe(100);
      expect(event.y).toBe(200);
      expect(event.tokenType).toBe('player');
      expect(event.label).toBe('Warrior');
      expect(event.placedAt).toBe(fixedDate.toISOString());
    });

    it('should store token in aggregate state', () => {
      const aggregate = TokenAggregate.createNew(campaignId);
      aggregate.placeToken(tokenId1, mapLevelId, 100, 200, 'npc', 'Guard', clock);

      const tokens = aggregate.getTokens();
      expect(tokens.size).toBe(1);
      expect(tokens.get(tokenId1)).toEqual({
        id: tokenId1,
        mapLevelId,
        x: 100,
        y: 200,
        tokenType: 'npc',
        label: 'Guard',
      });
    });

    it('should throw TokenAlreadyExistsException on duplicate tokenId', () => {
      const aggregate = TokenAggregate.createNew(campaignId);
      aggregate.placeToken(tokenId1, mapLevelId, 100, 200, 'player', 'Warrior', clock);

      expect(() =>
        aggregate.placeToken(tokenId1, mapLevelId, 300, 400, 'npc', 'Guard', clock),
      ).toThrow(TokenAlreadyExistsException);
    });

    it('should throw on invalid tokenId', () => {
      const aggregate = TokenAggregate.createNew(campaignId);
      expect(() =>
        aggregate.placeToken('bad-id', mapLevelId, 0, 0, 'player', 'Test', clock),
      ).toThrow(InvalidTokenIdException);
    });

    it('should throw on negative position', () => {
      const aggregate = TokenAggregate.createNew(campaignId);
      expect(() =>
        aggregate.placeToken(tokenId1, mapLevelId, -1, 0, 'player', 'Test', clock),
      ).toThrow(InvalidTokenPositionException);
    });

    it('should throw on invalid token type', () => {
      const aggregate = TokenAggregate.createNew(campaignId);
      expect(() =>
        aggregate.placeToken(tokenId1, mapLevelId, 0, 0, 'boss', 'Test', clock),
      ).toThrow(InvalidTokenTypeException);
    });

    it('should throw on empty label', () => {
      const aggregate = TokenAggregate.createNew(campaignId);
      expect(() =>
        aggregate.placeToken(tokenId1, mapLevelId, 0, 0, 'player', '', clock),
      ).toThrow(InvalidTokenLabelException);
    });

    it('should throw MapLevelRequiredException on empty mapLevelId', () => {
      const aggregate = TokenAggregate.createNew(campaignId);
      expect(() =>
        aggregate.placeToken(tokenId1, '', 0, 0, 'player', 'Test', clock),
      ).toThrow(MapLevelRequiredException);
    });

    it('should allow multiple tokens on same map level', () => {
      const aggregate = TokenAggregate.createNew(campaignId);
      aggregate.placeToken(tokenId1, mapLevelId, 100, 200, 'player', 'Warrior', clock);
      aggregate.placeToken(tokenId2, mapLevelId, 300, 400, 'monster', 'Dragon', clock);

      expect(aggregate.getTokens().size).toBe(2);
      expect(aggregate.getUncommittedEvents()).toHaveLength(2);
    });
  });

  describe('moveToken', () => {
    it('should move an existing token and emit TokenMoved event', () => {
      const aggregate = TokenAggregate.createNew(campaignId);
      aggregate.placeToken(tokenId1, mapLevelId, 100, 200, 'player', 'Warrior', clock);
      aggregate.moveToken(tokenId1, 300, 400, clock);

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(2);
      expect(events[1]).toBeInstanceOf(TokenMoved);

      const event = events[1] as TokenMoved;
      expect(event.tokenId).toBe(tokenId1);
      expect(event.x).toBe(300);
      expect(event.y).toBe(400);
      expect(event.mapLevelId).toBe(mapLevelId);
    });

    it('should update token position in state', () => {
      const aggregate = TokenAggregate.createNew(campaignId);
      aggregate.placeToken(tokenId1, mapLevelId, 100, 200, 'player', 'Warrior', clock);
      aggregate.moveToken(tokenId1, 300, 400, clock);

      const token = aggregate.getTokens().get(tokenId1)!;
      expect(token.x).toBe(300);
      expect(token.y).toBe(400);
    });

    it('should throw TokenNotFoundException for non-existent token', () => {
      const aggregate = TokenAggregate.createNew(campaignId);
      expect(() => aggregate.moveToken(tokenId1, 100, 200, clock)).toThrow(
        TokenNotFoundException,
      );
    });

    it('should throw on invalid position', () => {
      const aggregate = TokenAggregate.createNew(campaignId);
      aggregate.placeToken(tokenId1, mapLevelId, 100, 200, 'player', 'Warrior', clock);
      expect(() => aggregate.moveToken(tokenId1, -10, 200, clock)).toThrow(
        InvalidTokenPositionException,
      );
    });
  });

  describe('removeToken', () => {
    it('should remove an existing token and emit TokenRemoved event', () => {
      const aggregate = TokenAggregate.createNew(campaignId);
      aggregate.placeToken(tokenId1, mapLevelId, 100, 200, 'player', 'Warrior', clock);
      aggregate.removeToken(tokenId1, clock);

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(2);
      expect(events[1]).toBeInstanceOf(TokenRemoved);

      const event = events[1] as TokenRemoved;
      expect(event.tokenId).toBe(tokenId1);
      expect(event.mapLevelId).toBe(mapLevelId);
    });

    it('should remove token from state', () => {
      const aggregate = TokenAggregate.createNew(campaignId);
      aggregate.placeToken(tokenId1, mapLevelId, 100, 200, 'player', 'Warrior', clock);
      aggregate.removeToken(tokenId1, clock);

      expect(aggregate.getTokens().size).toBe(0);
    });

    it('should throw TokenNotFoundException for non-existent token', () => {
      const aggregate = TokenAggregate.createNew(campaignId);
      expect(() => aggregate.removeToken(tokenId1, clock)).toThrow(
        TokenNotFoundException,
      );
    });
  });

  describe('loadFromHistory', () => {
    it('should reconstruct aggregate from events', () => {
      const events = [
        {
          type: 'TokenPlaced',
          data: {
            campaignId,
            mapLevelId,
            tokenId: tokenId1,
            x: 100,
            y: 200,
            tokenType: 'player',
            label: 'Warrior',
            placedAt: '2026-03-09T10:00:00.000Z',
          },
        },
        {
          type: 'TokenMoved',
          data: {
            campaignId,
            mapLevelId,
            tokenId: tokenId1,
            x: 300,
            y: 400,
            movedAt: '2026-03-09T11:00:00.000Z',
          },
        },
      ];

      const aggregate = TokenAggregate.loadFromHistory(campaignId, events);

      expect(aggregate.getCampaignId()).toBe(campaignId);
      expect(aggregate.getTokens().size).toBe(1);
      const token = aggregate.getTokens().get(tokenId1)!;
      expect(token.x).toBe(300);
      expect(token.y).toBe(400);
      expect(aggregate.getUncommittedEvents()).toHaveLength(0);
    });

    it('should handle TokenRemoved in history', () => {
      const events = [
        {
          type: 'TokenPlaced',
          data: {
            campaignId,
            mapLevelId,
            tokenId: tokenId1,
            x: 100,
            y: 200,
            tokenType: 'monster',
            label: 'Goblin',
            placedAt: '2026-03-09T10:00:00.000Z',
          },
        },
        {
          type: 'TokenRemoved',
          data: {
            campaignId,
            mapLevelId,
            tokenId: tokenId1,
            removedAt: '2026-03-09T11:00:00.000Z',
          },
        },
      ];

      const aggregate = TokenAggregate.loadFromHistory(campaignId, events);
      expect(aggregate.getTokens().size).toBe(0);
    });

    it('should throw on unknown event type', () => {
      const events = [{ type: 'UnknownEvent', data: {} }];
      expect(() => TokenAggregate.loadFromHistory(campaignId, events)).toThrow(
        'Unknown event type',
      );
    });

    it('should throw on missing required field in event data', () => {
      const events = [
        {
          type: 'TokenPlaced',
          data: { campaignId, tokenId: tokenId1 },
        },
      ];
      expect(() => TokenAggregate.loadFromHistory(campaignId, events)).toThrow(
        'Invalid event data',
      );
    });

    it('should validate data types during replay', () => {
      const events = [
        {
          type: 'TokenPlaced',
          data: {
            campaignId,
            mapLevelId,
            tokenId: tokenId1,
            x: 'not-a-number',
            y: 200,
            tokenType: 'player',
            label: 'Warrior',
            placedAt: '2026-03-09T10:00:00.000Z',
          },
        },
      ];
      expect(() => TokenAggregate.loadFromHistory(campaignId, events)).toThrow(
        'Invalid event data',
      );
    });
  });

  describe('clearEvents', () => {
    it('should clear uncommitted events', () => {
      const aggregate = TokenAggregate.createNew(campaignId);
      aggregate.placeToken(tokenId1, mapLevelId, 100, 200, 'player', 'Warrior', clock);
      expect(aggregate.getUncommittedEvents()).toHaveLength(1);

      aggregate.clearEvents();
      expect(aggregate.getUncommittedEvents()).toHaveLength(0);
    });
  });
});
