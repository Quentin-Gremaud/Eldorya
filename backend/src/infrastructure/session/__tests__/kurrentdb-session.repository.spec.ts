import { KurrentDbSessionRepository } from '../kurrentdb-session.repository.js';
import { SessionAggregate } from '../../../session/session/session.aggregate.js';
import type { Clock } from '../../../shared/clock.js';

describe('KurrentDbSessionRepository', () => {
  const sessionId = '550e8400-e29b-41d4-a716-446655440000';
  const campaignId = '660e8400-e29b-41d4-a716-446655440001';
  const gmUserId = 'user_gm_123';
  const fixedDate = new Date('2026-03-14T10:00:00.000Z');
  const clock: Clock = { now: () => fixedDate };

  let mockKurrentDb: {
    appendEventsToNewStream: jest.Mock;
    appendEventsToStream: jest.Mock;
    readStream: jest.Mock;
  };
  let repository: KurrentDbSessionRepository;

  beforeEach(() => {
    mockKurrentDb = {
      appendEventsToNewStream: jest.fn().mockResolvedValue(undefined),
      appendEventsToStream: jest.fn().mockResolvedValue(undefined),
      readStream: jest.fn(),
    };

    repository = new KurrentDbSessionRepository(
      mockKurrentDb as any,
      clock,
    );
  });

  describe('saveNew', () => {
    it('should serialize SessionStarted event correctly', async () => {
      const aggregate = SessionAggregate.start(sessionId, campaignId, gmUserId, clock);

      await repository.saveNew(aggregate);

      expect(mockKurrentDb.appendEventsToNewStream).toHaveBeenCalledTimes(1);
      const [streamName, events] = mockKurrentDb.appendEventsToNewStream.mock.calls[0];
      expect(streamName).toBe(`session-${sessionId}`);
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('SessionStarted');
      expect(events[0].data).toEqual({
        sessionId,
        campaignId,
        gmUserId,
        mode: 'preparation',
        startedAt: fixedDate.toISOString(),
      });
    });

    it('should include metadata with correlationId, timestamp, sessionId, campaignId', async () => {
      const aggregate = SessionAggregate.start(sessionId, campaignId, gmUserId, clock);

      await repository.saveNew(aggregate);

      const events = mockKurrentDb.appendEventsToNewStream.mock.calls[0][1];
      expect(events[0].metadata).toEqual(
        expect.objectContaining({
          timestamp: fixedDate.toISOString(),
          sessionId,
          campaignId,
        }),
      );
      expect(events[0].metadata.correlationId).toBeDefined();
    });

    it('should clear events after save', async () => {
      const aggregate = SessionAggregate.start(sessionId, campaignId, gmUserId, clock);

      await repository.saveNew(aggregate);

      expect(aggregate.getUncommittedEvents()).toHaveLength(0);
    });
  });

  describe('save', () => {
    it('should serialize SessionModeChanged event correctly', async () => {
      const aggregate = SessionAggregate.start(sessionId, campaignId, gmUserId, clock);
      aggregate.clearEvents();
      aggregate.changeMode('live', clock);

      await repository.save(aggregate);

      expect(mockKurrentDb.appendEventsToStream).toHaveBeenCalledTimes(1);
      const [streamName, events] = mockKurrentDb.appendEventsToStream.mock.calls[0];
      expect(streamName).toBe(`session-${sessionId}`);
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('SessionModeChanged');
      expect(events[0].data).toEqual({
        sessionId,
        campaignId,
        newMode: 'live',
        changedAt: fixedDate.toISOString(),
      });
    });

    it('should clear events after save', async () => {
      const aggregate = SessionAggregate.start(sessionId, campaignId, gmUserId, clock);
      aggregate.clearEvents();
      aggregate.changeMode('live', clock);

      await repository.save(aggregate);

      expect(aggregate.getUncommittedEvents()).toHaveLength(0);
    });
  });

  describe('load', () => {
    it('should reconstruct aggregate from events', async () => {
      mockKurrentDb.readStream.mockResolvedValue([
        {
          type: 'SessionStarted',
          data: {
            sessionId,
            campaignId,
            gmUserId,
            mode: 'preparation',
            startedAt: fixedDate.toISOString(),
          },
        },
        {
          type: 'SessionModeChanged',
          data: {
            sessionId,
            campaignId,
            newMode: 'live',
            changedAt: '2026-03-14T11:00:00.000Z',
          },
        },
      ]);

      const aggregate = await repository.load(sessionId);

      expect(aggregate.getSessionId()).toBe(sessionId);
      expect(aggregate.getCampaignId()).toBe(campaignId);
      expect(aggregate.getGmUserId()).toBe(gmUserId);
      expect(aggregate.getMode()).toBe('live');
      expect(aggregate.getStatus()).toBe('active');
    });

    it('should use correct stream name', async () => {
      mockKurrentDb.readStream.mockResolvedValue([
        {
          type: 'SessionStarted',
          data: {
            sessionId,
            campaignId,
            gmUserId,
            mode: 'preparation',
            startedAt: fixedDate.toISOString(),
          },
        },
      ]);

      await repository.load(sessionId);

      expect(mockKurrentDb.readStream).toHaveBeenCalledWith(`session-${sessionId}`);
    });
  });
});
