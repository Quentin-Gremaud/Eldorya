import { SessionAggregate } from '../session.aggregate.js';
import { SessionStarted } from '../events/session-started.event.js';
import { SessionModeChanged } from '../events/session-mode-changed.event.js';
import { PipelineModeChanged } from '../events/pipeline-mode-changed.event.js';
import { SessionNotActiveException } from '../exceptions/session-not-active.exception.js';
import { SameModeTransitionException } from '../exceptions/same-mode-transition.exception.js';
import { SamePipelineModeException } from '../exceptions/same-pipeline-mode.exception.js';
import { NotSessionGmException } from '../exceptions/not-session-gm.exception.js';
import type { Clock } from '../../../shared/clock.js';

describe('SessionAggregate', () => {
  const sessionId = '550e8400-e29b-41d4-a716-446655440000';
  const campaignId = '660e8400-e29b-41d4-a716-446655440001';
  const gmUserId = 'user_gm_123';

  const fixedDate = new Date('2026-03-14T10:00:00.000Z');
  const clock: Clock = { now: () => fixedDate };

  describe('start', () => {
    it('should create a new session in preparation mode', () => {
      const aggregate = SessionAggregate.start(sessionId, campaignId, gmUserId, clock);

      expect(aggregate.getSessionId()).toBe(sessionId);
      expect(aggregate.getCampaignId()).toBe(campaignId);
      expect(aggregate.getGmUserId()).toBe(gmUserId);
      expect(aggregate.getMode()).toBe('preparation');
      expect(aggregate.getStatus()).toBe('active');
      expect(aggregate.getStartedAt()).toBe(fixedDate.toISOString());
      expect(aggregate.isNew()).toBe(true);
    });

    it('should emit a SessionStarted event', () => {
      const aggregate = SessionAggregate.start(sessionId, campaignId, gmUserId, clock);

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(SessionStarted);

      const event = events[0] as SessionStarted;
      expect(event.sessionId).toBe(sessionId);
      expect(event.campaignId).toBe(campaignId);
      expect(event.gmUserId).toBe(gmUserId);
      expect(event.mode).toBe('preparation');
      expect(event.startedAt).toBe(fixedDate.toISOString());
    });

    it('should throw on empty sessionId', () => {
      expect(() => SessionAggregate.start('', campaignId, gmUserId, clock)).toThrow(
        'SessionId cannot be empty',
      );
    });

    it('should throw on empty campaignId', () => {
      expect(() => SessionAggregate.start(sessionId, '', gmUserId, clock)).toThrow(
        'CampaignId cannot be empty',
      );
    });

    it('should throw on empty gmUserId', () => {
      expect(() => SessionAggregate.start(sessionId, campaignId, '', clock)).toThrow(
        'GM user ID cannot be empty',
      );
    });
  });

  describe('changeMode', () => {
    it('should toggle from preparation to live', () => {
      const aggregate = SessionAggregate.start(sessionId, campaignId, gmUserId, clock);
      aggregate.clearEvents();

      aggregate.changeMode('live', clock);

      expect(aggregate.getMode()).toBe('live');
      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(SessionModeChanged);

      const event = events[0] as SessionModeChanged;
      expect(event.sessionId).toBe(sessionId);
      expect(event.campaignId).toBe(campaignId);
      expect(event.newMode).toBe('live');
      expect(event.changedAt).toBe(fixedDate.toISOString());
    });

    it('should toggle from live to preparation', () => {
      const aggregate = SessionAggregate.start(sessionId, campaignId, gmUserId, clock);
      aggregate.changeMode('live', clock);
      aggregate.clearEvents();

      aggregate.changeMode('preparation', clock);

      expect(aggregate.getMode()).toBe('preparation');
      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(SessionModeChanged);
    });

    it('should throw SameModeTransitionException when toggling to same mode', () => {
      const aggregate = SessionAggregate.start(sessionId, campaignId, gmUserId, clock);

      expect(() => aggregate.changeMode('preparation', clock)).toThrow(
        SameModeTransitionException,
      );
    });

    it('should throw on invalid mode', () => {
      const aggregate = SessionAggregate.start(sessionId, campaignId, gmUserId, clock);

      expect(() => aggregate.changeMode('invalid', clock)).toThrow(
        "Invalid SessionMode: 'invalid'",
      );
    });
  });

  describe('togglePipelineMode', () => {
    it('should toggle from optional to mandatory', () => {
      const aggregate = SessionAggregate.start(sessionId, campaignId, gmUserId, clock);
      aggregate.clearEvents();

      aggregate.togglePipelineMode('mandatory', gmUserId, clock);

      expect(aggregate.getPipelineMode()).toBe('mandatory');
      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(PipelineModeChanged);

      const event = events[0] as PipelineModeChanged;
      expect(event.sessionId).toBe(sessionId);
      expect(event.campaignId).toBe(campaignId);
      expect(event.pipelineMode).toBe('mandatory');
      expect(event.changedAt).toBe(fixedDate.toISOString());
    });

    it('should toggle from mandatory to optional', () => {
      const aggregate = SessionAggregate.start(sessionId, campaignId, gmUserId, clock);
      aggregate.togglePipelineMode('mandatory', gmUserId, clock);
      aggregate.clearEvents();

      aggregate.togglePipelineMode('optional', gmUserId, clock);

      expect(aggregate.getPipelineMode()).toBe('optional');
      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(PipelineModeChanged);
    });

    it('should throw SamePipelineModeException when toggling to same mode', () => {
      const aggregate = SessionAggregate.start(sessionId, campaignId, gmUserId, clock);

      expect(() =>
        aggregate.togglePipelineMode('optional', gmUserId, clock),
      ).toThrow(SamePipelineModeException);
    });

    it('should throw NotSessionGmException if caller is not GM', () => {
      const aggregate = SessionAggregate.start(sessionId, campaignId, gmUserId, clock);

      expect(() =>
        aggregate.togglePipelineMode('mandatory', 'other-user', clock),
      ).toThrow(NotSessionGmException);
    });

    it('should throw on invalid pipeline mode', () => {
      const aggregate = SessionAggregate.start(sessionId, campaignId, gmUserId, clock);

      expect(() =>
        aggregate.togglePipelineMode('invalid', gmUserId, clock),
      ).toThrow("Invalid PipelineMode: 'invalid'");
    });

    it('should default to optional mode when session starts', () => {
      const aggregate = SessionAggregate.start(sessionId, campaignId, gmUserId, clock);

      expect(aggregate.getPipelineMode()).toBe('optional');
    });
  });

  describe('loadFromHistory', () => {
    it('should reconstruct aggregate from SessionStarted event', () => {
      const events = [
        {
          type: 'SessionStarted',
          data: {
            sessionId,
            campaignId,
            gmUserId,
            mode: 'preparation',
            startedAt: '2026-03-14T10:00:00.000Z',
          },
        },
      ];

      const aggregate = SessionAggregate.loadFromHistory(sessionId, events);

      expect(aggregate.getSessionId()).toBe(sessionId);
      expect(aggregate.getCampaignId()).toBe(campaignId);
      expect(aggregate.getGmUserId()).toBe(gmUserId);
      expect(aggregate.getMode()).toBe('preparation');
      expect(aggregate.getStatus()).toBe('active');
      expect(aggregate.isNew()).toBe(false);
      expect(aggregate.getUncommittedEvents()).toHaveLength(0);
    });

    it('should reconstruct aggregate with mode changes', () => {
      const events = [
        {
          type: 'SessionStarted',
          data: {
            sessionId,
            campaignId,
            gmUserId,
            mode: 'preparation',
            startedAt: '2026-03-14T10:00:00.000Z',
          },
        },
        {
          type: 'SessionModeChanged',
          data: {
            sessionId,
            campaignId,
            newMode: 'live',
            changedAt: '2026-03-14T10:30:00.000Z',
          },
        },
      ];

      const aggregate = SessionAggregate.loadFromHistory(sessionId, events);

      expect(aggregate.getMode()).toBe('live');
    });

    it('should reconstruct aggregate with pipeline mode changes', () => {
      const events = [
        {
          type: 'SessionStarted',
          data: {
            sessionId,
            campaignId,
            gmUserId,
            mode: 'preparation',
            startedAt: '2026-03-14T10:00:00.000Z',
          },
        },
        {
          type: 'PipelineModeChanged',
          data: {
            sessionId,
            campaignId,
            gmUserId,
            pipelineMode: 'mandatory',
            changedAt: '2026-03-14T10:30:00.000Z',
          },
        },
      ];

      const aggregate = SessionAggregate.loadFromHistory(sessionId, events);

      expect(aggregate.getPipelineMode()).toBe('mandatory');
    });

    it('should throw on unknown event type', () => {
      const events = [{ type: 'UnknownEvent', data: {} }];
      expect(() => SessionAggregate.loadFromHistory(sessionId, events)).toThrow(
        'Unknown event type',
      );
    });

    it('should throw on missing required field in event data', () => {
      const events = [
        {
          type: 'SessionStarted',
          data: { sessionId },
        },
      ];
      expect(() => SessionAggregate.loadFromHistory(sessionId, events)).toThrow(
        'Invalid event data',
      );
    });
  });

  describe('clearEvents', () => {
    it('should clear uncommitted events', () => {
      const aggregate = SessionAggregate.start(sessionId, campaignId, gmUserId, clock);
      expect(aggregate.getUncommittedEvents()).toHaveLength(1);

      aggregate.clearEvents();
      expect(aggregate.getUncommittedEvents()).toHaveLength(0);
    });
  });
});
