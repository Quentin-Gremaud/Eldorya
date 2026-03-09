import { KurrentDbMapRepository } from '../kurrentdb-map.repository.js';
import { MapAggregate } from '../../../world/map/map.aggregate.js';
import { MapLevelBackgroundSet } from '../../../world/map/events/map-level-background-set.event.js';
import type { Clock } from '../../../shared/clock.js';

describe('KurrentDbMapRepository', () => {
  const campaignId = '550e8400-e29b-41d4-a716-446655440000';
  const mapLevelId = '660e8400-e29b-41d4-a716-446655440001';
  const fixedDate = new Date('2026-03-08T10:00:00.000Z');
  const clock: Clock = { now: () => fixedDate };

  let mockKurrentDb: {
    appendEventsToStream: jest.Mock;
    appendEventsToNewStream: jest.Mock;
    readStream: jest.Mock;
  };
  let repository: KurrentDbMapRepository;

  beforeEach(() => {
    mockKurrentDb = {
      appendEventsToStream: jest.fn().mockResolvedValue(undefined),
      appendEventsToNewStream: jest.fn().mockResolvedValue(undefined),
      readStream: jest.fn(),
    };

    repository = new KurrentDbMapRepository(
      mockKurrentDb as any,
      clock,
    );
  });

  describe('save - MapLevelBackgroundSet serialization', () => {
    it('should serialize MapLevelBackgroundSet event correctly', async () => {
      const map = MapAggregate.createNew(campaignId);
      map.createLevel(mapLevelId, 'World', null, clock);
      map.clearEvents();
      map.setBackground(mapLevelId, 'https://cdn.example.com/bg.jpg', clock);

      await repository.save(map);

      expect(mockKurrentDb.appendEventsToStream).toHaveBeenCalledTimes(1);
      const events = mockKurrentDb.appendEventsToStream.mock.calls[0][1];
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('MapLevelBackgroundSet');
      expect(events[0].data).toEqual({
        campaignId,
        mapLevelId,
        backgroundImageUrl: 'https://cdn.example.com/bg.jpg',
        previousBackgroundImageUrl: null,
        setAt: fixedDate.toISOString(),
      });
    });

    it('should serialize MapLevelBackgroundSet with previous URL on replacement', async () => {
      const map = MapAggregate.createNew(campaignId);
      map.createLevel(mapLevelId, 'World', null, clock);
      map.setBackground(mapLevelId, 'https://cdn.example.com/old.jpg', clock);
      map.clearEvents();
      map.setBackground(mapLevelId, 'https://cdn.example.com/new.jpg', clock);

      await repository.save(map);

      const events = mockKurrentDb.appendEventsToStream.mock.calls[0][1];
      expect(events[0].data.previousBackgroundImageUrl).toBe('https://cdn.example.com/old.jpg');
      expect(events[0].data.backgroundImageUrl).toBe('https://cdn.example.com/new.jpg');
    });
  });

  describe('load - MapLevelBackgroundSet deserialization', () => {
    it('should reconstruct aggregate with MapLevelBackgroundSet event', async () => {
      mockKurrentDb.readStream.mockResolvedValue([
        {
          type: 'MapLevelCreated',
          data: {
            campaignId,
            mapLevelId,
            name: 'World',
            parentId: null,
            depth: 0,
            createdAt: fixedDate.toISOString(),
          },
        },
        {
          type: 'MapLevelBackgroundSet',
          data: {
            campaignId,
            mapLevelId,
            backgroundImageUrl: 'https://cdn.example.com/bg.jpg',
            previousBackgroundImageUrl: null,
            setAt: fixedDate.toISOString(),
          },
        },
      ]);

      const map = await repository.load(campaignId);

      expect(map.getLevels().get(mapLevelId)!.backgroundImageUrl).toBe(
        'https://cdn.example.com/bg.jpg',
      );
    });
  });
});
