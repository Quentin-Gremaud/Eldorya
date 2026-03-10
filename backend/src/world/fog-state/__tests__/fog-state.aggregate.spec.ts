import { FogStateAggregate } from '../fog-state.aggregate.js';
import { FogStateInitialized } from '../events/fog-state-initialized.event.js';
import { FogZoneRevealed } from '../events/fog-zone-revealed.event.js';
import { FogZoneHidden } from '../events/fog-zone-hidden.event.js';
import { FogZone } from '../fog-zone.js';
import { FogStateAlreadyInitializedException } from '../exceptions/fog-state-already-initialized.exception.js';
import { FogZoneAlreadyRevealedException } from '../exceptions/fog-zone-already-revealed.exception.js';
import { FogZoneNotFoundException } from '../exceptions/fog-zone-not-found.exception.js';
import { FogStateNotInitializedException } from '../exceptions/fog-state-not-initialized.exception.js';
import type { Clock } from '../../../shared/clock.js';

describe('FogStateAggregate', () => {
  const campaignId = '550e8400-e29b-41d4-a716-446655440000';
  const playerId = '660e8400-e29b-41d4-a716-446655440001';
  const fogZoneId = '770e8400-e29b-41d4-a716-446655440002';
  const mapLevelId = '880e8400-e29b-41d4-a716-446655440003';
  const fogZoneId2 = '990e8400-e29b-41d4-a716-446655440004';

  const fixedDate = new Date('2026-03-10T10:00:00.000Z');
  const clock: Clock = { now: () => fixedDate };

  describe('initialize', () => {
    it('should create a new initialized fog state', () => {
      const aggregate = FogStateAggregate.initialize(campaignId, playerId, clock);

      expect(aggregate.isNew()).toBe(true);
      expect(aggregate.isInitialized()).toBe(true);
      expect(aggregate.getCampaignId()).toBe(campaignId);
      expect(aggregate.getPlayerId()).toBe(playerId);
      expect(aggregate.getRevealedZones().size).toBe(0);
    });

    it('should emit FogStateInitialized event', () => {
      const aggregate = FogStateAggregate.initialize(campaignId, playerId, clock);

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(FogStateInitialized);

      const event = events[0] as FogStateInitialized;
      expect(event.campaignId).toBe(campaignId);
      expect(event.playerId).toBe(playerId);
      expect(event.initializedAt).toBe(fixedDate.toISOString());
    });

    it('should validate campaignId and playerId via FogStateId', () => {
      expect(() => FogStateAggregate.initialize('bad-id', playerId, clock)).toThrow();
      expect(() => FogStateAggregate.initialize(campaignId, 'bad-id', clock)).toThrow();
    });
  });

  describe('revealZone', () => {
    it('should reveal a zone and emit event', () => {
      const aggregate = FogStateAggregate.initialize(campaignId, playerId, clock);
      aggregate.clearEvents();

      const zone = FogZone.create(fogZoneId, mapLevelId, 10, 20, 100, 200);
      aggregate.revealZone(zone, clock);

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(FogZoneRevealed);

      const event = events[0] as FogZoneRevealed;
      expect(event.campaignId).toBe(campaignId);
      expect(event.playerId).toBe(playerId);
      expect(event.fogZoneId).toBe(fogZoneId);
      expect(event.mapLevelId).toBe(mapLevelId);
      expect(event.x).toBe(10);
      expect(event.y).toBe(20);
      expect(event.width).toBe(100);
      expect(event.height).toBe(200);
    });

    it('should add zone to revealed zones', () => {
      const aggregate = FogStateAggregate.initialize(campaignId, playerId, clock);
      const zone = FogZone.create(fogZoneId, mapLevelId, 10, 20, 100, 200);
      aggregate.revealZone(zone, clock);

      const zones = aggregate.getRevealedZones();
      expect(zones.size).toBe(1);
      expect(zones.get(fogZoneId)).toEqual({
        id: fogZoneId,
        mapLevelId,
        x: 10,
        y: 20,
        width: 100,
        height: 200,
      });
    });

    it('should throw if zone already revealed', () => {
      const aggregate = FogStateAggregate.initialize(campaignId, playerId, clock);
      const zone = FogZone.create(fogZoneId, mapLevelId, 10, 20, 100, 200);
      aggregate.revealZone(zone, clock);

      expect(() => aggregate.revealZone(zone, clock)).toThrow(
        FogZoneAlreadyRevealedException,
      );
    });

    it('should throw FogStateNotInitializedException if not initialized', () => {
      const aggregate = FogStateAggregate.loadFromHistory(campaignId, playerId, []);
      const zone = FogZone.create(fogZoneId, mapLevelId, 10, 20, 100, 200);

      expect(() => aggregate.revealZone(zone, clock)).toThrow(
        FogStateNotInitializedException,
      );
    });
  });

  describe('hideZone', () => {
    it('should hide a revealed zone and emit event', () => {
      const aggregate = FogStateAggregate.initialize(campaignId, playerId, clock);
      const zone = FogZone.create(fogZoneId, mapLevelId, 10, 20, 100, 200);
      aggregate.revealZone(zone, clock);
      aggregate.clearEvents();

      aggregate.hideZone(fogZoneId, clock);

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(FogZoneHidden);

      const event = events[0] as FogZoneHidden;
      expect(event.fogZoneId).toBe(fogZoneId);
      expect(event.mapLevelId).toBe(mapLevelId);
    });

    it('should remove zone from revealed zones', () => {
      const aggregate = FogStateAggregate.initialize(campaignId, playerId, clock);
      const zone = FogZone.create(fogZoneId, mapLevelId, 10, 20, 100, 200);
      aggregate.revealZone(zone, clock);

      aggregate.hideZone(fogZoneId, clock);
      expect(aggregate.getRevealedZones().size).toBe(0);
    });

    it('should throw if zone not found', () => {
      const aggregate = FogStateAggregate.initialize(campaignId, playerId, clock);

      expect(() => aggregate.hideZone(fogZoneId, clock)).toThrow(
        FogZoneNotFoundException,
      );
    });

    it('should throw FogStateNotInitializedException if not initialized', () => {
      const aggregate = FogStateAggregate.loadFromHistory(campaignId, playerId, []);

      expect(() => aggregate.hideZone(fogZoneId, clock)).toThrow(
        FogStateNotInitializedException,
      );
    });
  });

  describe('loadFromHistory', () => {
    it('should reconstruct from FogStateInitialized event', () => {
      const aggregate = FogStateAggregate.loadFromHistory(campaignId, playerId, [
        {
          type: 'FogStateInitialized',
          data: { campaignId, playerId, initializedAt: fixedDate.toISOString() },
        },
      ]);

      expect(aggregate.isInitialized()).toBe(true);
      expect(aggregate.isNew()).toBe(false);
      expect(aggregate.getCampaignId()).toBe(campaignId);
      expect(aggregate.getPlayerId()).toBe(playerId);
    });

    it('should reconstruct with revealed zones', () => {
      const aggregate = FogStateAggregate.loadFromHistory(campaignId, playerId, [
        {
          type: 'FogStateInitialized',
          data: { campaignId, playerId, initializedAt: fixedDate.toISOString() },
        },
        {
          type: 'FogZoneRevealed',
          data: {
            campaignId,
            playerId,
            fogZoneId,
            mapLevelId,
            x: 10,
            y: 20,
            width: 100,
            height: 200,
            revealedAt: fixedDate.toISOString(),
          },
        },
      ]);

      expect(aggregate.getRevealedZones().size).toBe(1);
      expect(aggregate.getRevealedZones().get(fogZoneId)).toBeDefined();
    });

    it('should handle reveal then hide', () => {
      const aggregate = FogStateAggregate.loadFromHistory(campaignId, playerId, [
        {
          type: 'FogStateInitialized',
          data: { campaignId, playerId, initializedAt: fixedDate.toISOString() },
        },
        {
          type: 'FogZoneRevealed',
          data: {
            campaignId, playerId, fogZoneId, mapLevelId,
            x: 10, y: 20, width: 100, height: 200,
            revealedAt: fixedDate.toISOString(),
          },
        },
        {
          type: 'FogZoneHidden',
          data: {
            campaignId, playerId, fogZoneId, mapLevelId,
            hiddenAt: fixedDate.toISOString(),
          },
        },
      ]);

      expect(aggregate.getRevealedZones().size).toBe(0);
    });

    it('should handle multiple zones', () => {
      const aggregate = FogStateAggregate.loadFromHistory(campaignId, playerId, [
        {
          type: 'FogStateInitialized',
          data: { campaignId, playerId, initializedAt: fixedDate.toISOString() },
        },
        {
          type: 'FogZoneRevealed',
          data: {
            campaignId, playerId, fogZoneId, mapLevelId,
            x: 10, y: 20, width: 100, height: 200,
            revealedAt: fixedDate.toISOString(),
          },
        },
        {
          type: 'FogZoneRevealed',
          data: {
            campaignId, playerId, fogZoneId: fogZoneId2, mapLevelId,
            x: 30, y: 40, width: 150, height: 250,
            revealedAt: fixedDate.toISOString(),
          },
        },
      ]);

      expect(aggregate.getRevealedZones().size).toBe(2);
    });

    it('should throw on unknown event type', () => {
      expect(() =>
        FogStateAggregate.loadFromHistory(campaignId, playerId, [
          { type: 'UnknownEvent', data: {} },
        ]),
      ).toThrow('Unknown event type');
    });

    it('should throw on invalid event data', () => {
      expect(() =>
        FogStateAggregate.loadFromHistory(campaignId, playerId, [
          {
            type: 'FogStateInitialized',
            data: { campaignId: 123, playerId, initializedAt: fixedDate.toISOString() },
          },
        ]),
      ).toThrow('Invalid event data');
    });

    it('should throw FogStateAlreadyInitialized on double init in event stream', () => {
      expect(() =>
        FogStateAggregate.loadFromHistory(campaignId, playerId, [
          {
            type: 'FogStateInitialized',
            data: { campaignId, playerId, initializedAt: fixedDate.toISOString() },
          },
          {
            type: 'FogStateInitialized',
            data: { campaignId, playerId, initializedAt: fixedDate.toISOString() },
          },
        ]),
      ).toThrow(FogStateAlreadyInitializedException);
    });
  });

  describe('clearEvents', () => {
    it('should clear uncommitted events', () => {
      const aggregate = FogStateAggregate.initialize(campaignId, playerId, clock);
      expect(aggregate.getUncommittedEvents()).toHaveLength(1);

      aggregate.clearEvents();
      expect(aggregate.getUncommittedEvents()).toHaveLength(0);
    });
  });
});
