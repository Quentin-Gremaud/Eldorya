import { MapAggregate } from '../map.aggregate.js';
import { MapLevelCreated } from '../events/map-level-created.event.js';
import { MapLevelRenamed } from '../events/map-level-renamed.event.js';
import { MapLevelBackgroundSet } from '../events/map-level-background-set.event.js';
import { MaxMapDepthReachedException } from '../exceptions/max-map-depth-reached.exception.js';
import { ParentMapLevelNotFoundException } from '../exceptions/parent-map-level-not-found.exception.js';
import { MapLevelNotFoundException } from '../exceptions/map-level-not-found.exception.js';
import { DuplicateMapLevelNameException } from '../exceptions/duplicate-map-level-name.exception.js';
import { InvalidMapLevelIdException } from '../exceptions/invalid-map-level-id.exception.js';
import { InvalidMapLevelNameException } from '../exceptions/invalid-map-level-name.exception.js';
import { InvalidMapBackgroundImageUrlException } from '../exceptions/invalid-map-background-image-url.exception.js';
import type { Clock } from '../../../shared/clock.js';

describe('MapAggregate', () => {
  const campaignId = '550e8400-e29b-41d4-a716-446655440000';
  const mapLevelId1 = '660e8400-e29b-41d4-a716-446655440001';
  const mapLevelId2 = '660e8400-e29b-41d4-a716-446655440002';
  const mapLevelId3 = '660e8400-e29b-41d4-a716-446655440003';

  const fixedDate = new Date('2026-03-08T10:00:00.000Z');
  const clock: Clock = { now: () => fixedDate };

  describe('createNew', () => {
    it('should create a new empty map aggregate', () => {
      const map = MapAggregate.createNew(campaignId);
      expect(map.getCampaignId()).toBe(campaignId);
      expect(map.getLevels().size).toBe(0);
      expect(map.getUncommittedEvents()).toHaveLength(0);
    });
  });

  describe('createLevel', () => {
    it('should create a root level (no parent)', () => {
      const map = MapAggregate.createNew(campaignId);
      map.createLevel(mapLevelId1, 'World', null, clock);

      const events = map.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(MapLevelCreated);

      const event = events[0] as MapLevelCreated;
      expect(event.campaignId).toBe(campaignId);
      expect(event.mapLevelId).toBe(mapLevelId1);
      expect(event.name).toBe('World');
      expect(event.parentId).toBeNull();
      expect(event.depth).toBe(0);
      expect(event.createdAt).toBe(fixedDate.toISOString());
    });

    it('should create a child level under a parent', () => {
      const map = MapAggregate.createNew(campaignId);
      map.createLevel(mapLevelId1, 'World', null, clock);
      map.createLevel(mapLevelId2, 'Continent', mapLevelId1, clock);

      const events = map.getUncommittedEvents();
      expect(events).toHaveLength(2);

      const childEvent = events[1] as MapLevelCreated;
      expect(childEvent.parentId).toBe(mapLevelId1);
      expect(childEvent.depth).toBe(1);
    });

    it('should store level in aggregate state', () => {
      const map = MapAggregate.createNew(campaignId);
      map.createLevel(mapLevelId1, 'World', null, clock);

      const levels = map.getLevels();
      expect(levels.size).toBe(1);
      expect(levels.get(mapLevelId1)).toEqual({
        id: mapLevelId1,
        name: 'World',
        parentId: null,
        depth: 0,
        backgroundImageUrl: null,
      });
    });

    it('should throw on invalid mapLevelId', () => {
      const map = MapAggregate.createNew(campaignId);
      expect(() => map.createLevel('bad-id', 'World', null, clock)).toThrow(
        InvalidMapLevelIdException,
      );
    });

    it('should throw on empty name', () => {
      const map = MapAggregate.createNew(campaignId);
      expect(() => map.createLevel(mapLevelId1, '', null, clock)).toThrow(
        InvalidMapLevelNameException,
      );
    });

    it('should throw when parent does not exist', () => {
      const map = MapAggregate.createNew(campaignId);
      expect(() =>
        map.createLevel(mapLevelId1, 'City', mapLevelId2, clock),
      ).toThrow(ParentMapLevelNotFoundException);
    });

    it('should throw on duplicate name at same parent level', () => {
      const map = MapAggregate.createNew(campaignId);
      map.createLevel(mapLevelId1, 'World', null, clock);
      expect(() =>
        map.createLevel(mapLevelId2, 'World', null, clock),
      ).toThrow(DuplicateMapLevelNameException);
    });

    it('should allow same name under different parents', () => {
      const map = MapAggregate.createNew(campaignId);
      map.createLevel(mapLevelId1, 'Region A', null, clock);
      map.createLevel(mapLevelId2, 'Region B', null, clock);
      map.createLevel(mapLevelId3, 'Tavern', mapLevelId1, clock);
      const id4 = '660e8400-e29b-41d4-a716-446655440004';
      expect(() =>
        map.createLevel(id4, 'Tavern', mapLevelId2, clock),
      ).not.toThrow();
    });

    it('should throw MaxMapDepthReachedException when parent depth is 9', () => {
      const map = MapAggregate.createNew(campaignId);

      // Build chain: depth 0→1→2→3→4→5→6→7→8→9
      let parentId: string | null = null;
      for (let i = 0; i <= 9; i++) {
        const id = `660e8400-e29b-41d4-a716-44665544000${i.toString(16)}`;
        map.createLevel(id, `Level ${i}`, parentId, clock);
        parentId = id;
      }

      // parentId now points to depth 9 level
      const id11 = '770e8400-e29b-41d4-a716-446655440000';
      expect(() =>
        map.createLevel(id11, 'Level 10', parentId, clock),
      ).toThrow(MaxMapDepthReachedException);
    });

    it('should allow creating at depth 9 (parent at depth 8)', () => {
      const map = MapAggregate.createNew(campaignId);

      let parentId: string | null = null;
      for (let i = 0; i <= 8; i++) {
        const id = `660e8400-e29b-41d4-a716-44665544000${i.toString(16)}`;
        map.createLevel(id, `Level ${i}`, parentId, clock);
        parentId = id;
      }

      // parentId now points to depth 8 level → child at depth 9 is OK
      const id10 = '770e8400-e29b-41d4-a716-446655440000';
      expect(() =>
        map.createLevel(id10, 'Level 9', parentId, clock),
      ).not.toThrow();
    });
  });

  describe('renameLevel', () => {
    it('should rename an existing level', () => {
      const map = MapAggregate.createNew(campaignId);
      map.createLevel(mapLevelId1, 'World', null, clock);
      map.renameLevel(mapLevelId1, 'New World', clock);

      const events = map.getUncommittedEvents();
      expect(events).toHaveLength(2);
      expect(events[1]).toBeInstanceOf(MapLevelRenamed);

      const renameEvent = events[1] as MapLevelRenamed;
      expect(renameEvent.mapLevelId).toBe(mapLevelId1);
      expect(renameEvent.newName).toBe('New World');
    });

    it('should update level state after rename', () => {
      const map = MapAggregate.createNew(campaignId);
      map.createLevel(mapLevelId1, 'World', null, clock);
      map.renameLevel(mapLevelId1, 'New World', clock);

      const levels = map.getLevels();
      expect(levels.get(mapLevelId1)!.name).toBe('New World');
    });

    it('should throw when level does not exist', () => {
      const map = MapAggregate.createNew(campaignId);
      expect(() =>
        map.renameLevel(mapLevelId1, 'New Name', clock),
      ).toThrow(MapLevelNotFoundException);
    });

    it('should throw on duplicate name at same parent after rename', () => {
      const map = MapAggregate.createNew(campaignId);
      map.createLevel(mapLevelId1, 'World', null, clock);
      map.createLevel(mapLevelId2, 'Region', null, clock);
      expect(() =>
        map.renameLevel(mapLevelId2, 'World', clock),
      ).toThrow(DuplicateMapLevelNameException);
    });
  });

  describe('loadFromHistory', () => {
    it('should reconstruct aggregate from events', () => {
      const events = [
        {
          type: 'MapLevelCreated',
          data: {
            campaignId,
            mapLevelId: mapLevelId1,
            name: 'World',
            parentId: null,
            depth: 0,
            createdAt: '2026-03-08T10:00:00.000Z',
          },
        },
        {
          type: 'MapLevelRenamed',
          data: {
            campaignId,
            mapLevelId: mapLevelId1,
            newName: 'New World',
            renamedAt: '2026-03-08T11:00:00.000Z',
          },
        },
      ];

      const map = MapAggregate.loadFromHistory(campaignId, events);

      expect(map.getCampaignId()).toBe(campaignId);
      expect(map.getLevels().size).toBe(1);
      expect(map.getLevels().get(mapLevelId1)!.name).toBe('New World');
      expect(map.getUncommittedEvents()).toHaveLength(0);
    });

    it('should throw on unknown event type', () => {
      const events = [{ type: 'UnknownEvent', data: {} }];
      expect(() => MapAggregate.loadFromHistory(campaignId, events)).toThrow(
        'Unknown event type',
      );
    });

    it('should reconstruct aggregate with background set event', () => {
      const events = [
        {
          type: 'MapLevelCreated',
          data: {
            campaignId,
            mapLevelId: mapLevelId1,
            name: 'World',
            parentId: null,
            depth: 0,
            createdAt: '2026-03-08T10:00:00.000Z',
          },
        },
        {
          type: 'MapLevelBackgroundSet',
          data: {
            campaignId,
            mapLevelId: mapLevelId1,
            backgroundImageUrl: 'https://cdn.example.com/bg.jpg',
            previousBackgroundImageUrl: null,
            setAt: '2026-03-08T12:00:00.000Z',
          },
        },
      ];

      const map = MapAggregate.loadFromHistory(campaignId, events);
      expect(map.getLevels().get(mapLevelId1)!.backgroundImageUrl).toBe(
        'https://cdn.example.com/bg.jpg',
      );
    });

    it('should reconstruct aggregate with background replacement', () => {
      const events = [
        {
          type: 'MapLevelCreated',
          data: {
            campaignId,
            mapLevelId: mapLevelId1,
            name: 'World',
            parentId: null,
            depth: 0,
            createdAt: '2026-03-08T10:00:00.000Z',
          },
        },
        {
          type: 'MapLevelBackgroundSet',
          data: {
            campaignId,
            mapLevelId: mapLevelId1,
            backgroundImageUrl: 'https://cdn.example.com/old.jpg',
            previousBackgroundImageUrl: null,
            setAt: '2026-03-08T11:00:00.000Z',
          },
        },
        {
          type: 'MapLevelBackgroundSet',
          data: {
            campaignId,
            mapLevelId: mapLevelId1,
            backgroundImageUrl: 'https://cdn.example.com/new.jpg',
            previousBackgroundImageUrl: 'https://cdn.example.com/old.jpg',
            setAt: '2026-03-08T12:00:00.000Z',
          },
        },
      ];

      const map = MapAggregate.loadFromHistory(campaignId, events);
      expect(map.getLevels().get(mapLevelId1)!.backgroundImageUrl).toBe(
        'https://cdn.example.com/new.jpg',
      );
    });

    it('should throw on missing required field in event data', () => {
      const events = [
        {
          type: 'MapLevelCreated',
          data: { campaignId, mapLevelId: mapLevelId1 },
        },
      ];
      expect(() => MapAggregate.loadFromHistory(campaignId, events)).toThrow(
        'Invalid event data',
      );
    });
  });

  describe('setBackground', () => {
    it('should set background on existing level', () => {
      const map = MapAggregate.createNew(campaignId);
      map.createLevel(mapLevelId1, 'World', null, clock);
      map.setBackground(mapLevelId1, 'https://cdn.example.com/img.jpg', clock);

      const events = map.getUncommittedEvents();
      expect(events).toHaveLength(2);
      expect(events[1]).toBeInstanceOf(MapLevelBackgroundSet);

      const bgEvent = events[1] as MapLevelBackgroundSet;
      expect(bgEvent.campaignId).toBe(campaignId);
      expect(bgEvent.mapLevelId).toBe(mapLevelId1);
      expect(bgEvent.backgroundImageUrl).toBe('https://cdn.example.com/img.jpg');
      expect(bgEvent.previousBackgroundImageUrl).toBeNull();
      expect(bgEvent.setAt).toBe(fixedDate.toISOString());
    });

    it('should update aggregate state with background URL', () => {
      const map = MapAggregate.createNew(campaignId);
      map.createLevel(mapLevelId1, 'World', null, clock);
      map.setBackground(mapLevelId1, 'https://cdn.example.com/img.jpg', clock);

      const levels = map.getLevels();
      expect(levels.get(mapLevelId1)!.backgroundImageUrl).toBe('https://cdn.example.com/img.jpg');
    });

    it('should track previous background URL on replacement', () => {
      const map = MapAggregate.createNew(campaignId);
      map.createLevel(mapLevelId1, 'World', null, clock);
      map.setBackground(mapLevelId1, 'https://cdn.example.com/old.jpg', clock);
      map.setBackground(mapLevelId1, 'https://cdn.example.com/new.jpg', clock);

      const events = map.getUncommittedEvents();
      const replaceEvent = events[2] as MapLevelBackgroundSet;
      expect(replaceEvent.previousBackgroundImageUrl).toBe('https://cdn.example.com/old.jpg');
      expect(replaceEvent.backgroundImageUrl).toBe('https://cdn.example.com/new.jpg');
    });

    it('should throw MapLevelNotFoundException when level does not exist', () => {
      const map = MapAggregate.createNew(campaignId);
      expect(() =>
        map.setBackground(mapLevelId1, 'https://cdn.example.com/img.jpg', clock),
      ).toThrow(MapLevelNotFoundException);
    });

    it('should throw InvalidMapBackgroundImageUrlException on empty URL', () => {
      const map = MapAggregate.createNew(campaignId);
      map.createLevel(mapLevelId1, 'World', null, clock);
      expect(() => map.setBackground(mapLevelId1, '', clock)).toThrow(
        InvalidMapBackgroundImageUrlException,
      );
    });

    it('should throw on invalid map level ID', () => {
      const map = MapAggregate.createNew(campaignId);
      expect(() =>
        map.setBackground('bad-id', 'https://cdn.example.com/img.jpg', clock),
      ).toThrow(InvalidMapLevelIdException);
    });
  });

  describe('clearEvents', () => {
    it('should clear uncommitted events', () => {
      const map = MapAggregate.createNew(campaignId);
      map.createLevel(mapLevelId1, 'World', null, clock);
      expect(map.getUncommittedEvents()).toHaveLength(1);

      map.clearEvents();
      expect(map.getUncommittedEvents()).toHaveLength(0);
    });
  });
});
