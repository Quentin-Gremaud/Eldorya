import { KurrentDbTokenRepository } from '../kurrentdb-token.repository.js';
import { TokenAggregate } from '../../../world/token/token.aggregate.js';
import type { Clock } from '../../../shared/clock.js';

describe('KurrentDbTokenRepository', () => {
  const campaignId = '550e8400-e29b-41d4-a716-446655440000';
  const mapLevelId = '660e8400-e29b-41d4-a716-446655440001';
  const tokenId = '770e8400-e29b-41d4-a716-446655440001';
  const fixedDate = new Date('2026-03-09T10:00:00.000Z');
  const clock: Clock = { now: () => fixedDate };

  let mockKurrentDb: {
    appendEventsToStream: jest.Mock;
    readStream: jest.Mock;
  };
  let repository: KurrentDbTokenRepository;

  beforeEach(() => {
    mockKurrentDb = {
      appendEventsToStream: jest.fn().mockResolvedValue(undefined),
      readStream: jest.fn(),
    };

    repository = new KurrentDbTokenRepository(
      mockKurrentDb as any,
      clock,
    );
  });

  describe('save', () => {
    it('should serialize TokenPlaced event correctly', async () => {
      const aggregate = TokenAggregate.createNew(campaignId);
      aggregate.placeToken(tokenId, mapLevelId, 100, 200, 'player', 'Warrior', clock);

      await repository.save(aggregate);

      expect(mockKurrentDb.appendEventsToStream).toHaveBeenCalledTimes(1);
      const [streamName, events] = mockKurrentDb.appendEventsToStream.mock.calls[0];
      expect(streamName).toBe(`token-${campaignId}`);
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('TokenPlaced');
      expect(events[0].data).toEqual({
        campaignId,
        mapLevelId,
        tokenId,
        x: 100,
        y: 200,
        tokenType: 'player',
        label: 'Warrior',
        placedAt: fixedDate.toISOString(),
      });
    });

    it('should serialize TokenMoved event correctly', async () => {
      const aggregate = TokenAggregate.createNew(campaignId);
      aggregate.placeToken(tokenId, mapLevelId, 100, 200, 'player', 'Warrior', clock);
      aggregate.clearEvents();
      aggregate.moveToken(tokenId, 300, 400, clock);

      await repository.save(aggregate);

      const events = mockKurrentDb.appendEventsToStream.mock.calls[0][1];
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('TokenMoved');
      expect(events[0].data).toEqual({
        campaignId,
        mapLevelId,
        tokenId,
        x: 300,
        y: 400,
        movedAt: fixedDate.toISOString(),
      });
    });

    it('should serialize TokenRemoved event correctly', async () => {
      const aggregate = TokenAggregate.createNew(campaignId);
      aggregate.placeToken(tokenId, mapLevelId, 100, 200, 'player', 'Warrior', clock);
      aggregate.clearEvents();
      aggregate.removeToken(tokenId, clock);

      await repository.save(aggregate);

      const events = mockKurrentDb.appendEventsToStream.mock.calls[0][1];
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('TokenRemoved');
      expect(events[0].data).toEqual({
        campaignId,
        mapLevelId,
        tokenId,
        removedAt: fixedDate.toISOString(),
      });
    });

    it('should batch multiple events in single append', async () => {
      const aggregate = TokenAggregate.createNew(campaignId);
      aggregate.placeToken(tokenId, mapLevelId, 100, 200, 'player', 'Warrior', clock);

      await repository.save(aggregate);

      expect(mockKurrentDb.appendEventsToStream).toHaveBeenCalledTimes(1);
    });

    it('should clear events after save', async () => {
      const aggregate = TokenAggregate.createNew(campaignId);
      aggregate.placeToken(tokenId, mapLevelId, 100, 200, 'player', 'Warrior', clock);

      await repository.save(aggregate);

      expect(aggregate.getUncommittedEvents()).toHaveLength(0);
    });
  });

  describe('load', () => {
    it('should reconstruct aggregate from events', async () => {
      mockKurrentDb.readStream.mockResolvedValue([
        {
          type: 'TokenPlaced',
          data: {
            campaignId,
            mapLevelId,
            tokenId,
            x: 100,
            y: 200,
            tokenType: 'player',
            label: 'Warrior',
            placedAt: fixedDate.toISOString(),
          },
        },
      ]);

      const aggregate = await repository.load(campaignId);

      expect(aggregate.getCampaignId()).toBe(campaignId);
      expect(aggregate.getTokens().size).toBe(1);
      const token = aggregate.getTokens().get(tokenId)!;
      expect(token.x).toBe(100);
      expect(token.y).toBe(200);
    });

    it('should return new aggregate when stream not found', async () => {
      mockKurrentDb.readStream.mockRejectedValue(
        new Error('Stream not found'),
      );

      const aggregate = await repository.load(campaignId);

      expect(aggregate.getCampaignId()).toBe(campaignId);
      expect(aggregate.getTokens().size).toBe(0);
    });

    it('should rethrow unexpected errors', async () => {
      mockKurrentDb.readStream.mockRejectedValue(
        new Error('Connection timeout'),
      );

      await expect(repository.load(campaignId)).rejects.toThrow(
        'Connection timeout',
      );
    });
  });
});
