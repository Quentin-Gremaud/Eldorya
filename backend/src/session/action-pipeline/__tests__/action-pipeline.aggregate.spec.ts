import { ActionPipelineAggregate } from '../action-pipeline.aggregate.js';
import { PlayerPinged } from '../events/player-pinged.event.js';
import { ActionProposed } from '../events/action-proposed.event.js';
import { InvalidActionProposalException } from '../exceptions/invalid-action-proposal.exception.js';
import { NotSessionGmException } from '../exceptions/not-session-gm.exception.js';
import type { Clock } from '../../../shared/clock.js';

describe('ActionPipelineAggregate', () => {
  const sessionId = '550e8400-e29b-41d4-a716-446655440000';
  const campaignId = '660e8400-e29b-41d4-a716-446655440001';
  const gmUserId = 'user_gm_123';
  const playerId = 'user_player_456';
  const actionId = '770e8400-e29b-41d4-a716-446655440002';

  const fixedDate = new Date('2026-03-18T10:00:00.000Z');
  const clock: Clock = { now: () => fixedDate };

  describe('create', () => {
    it('should create a new action pipeline aggregate', () => {
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);

      expect(aggregate.getSessionId()).toBe(sessionId);
      expect(aggregate.getCampaignId()).toBe(campaignId);
      expect(aggregate.isNew()).toBe(true);
      expect(aggregate.getPingedPlayerIds()).toEqual([]);
      expect(aggregate.getPendingActionIds()).toEqual([]);
      expect(aggregate.getUncommittedEvents()).toHaveLength(0);
    });

    it('should throw on empty sessionId', () => {
      expect(() => ActionPipelineAggregate.create('', campaignId)).toThrow(
        'SessionId cannot be empty',
      );
    });

    it('should throw on empty campaignId', () => {
      expect(() => ActionPipelineAggregate.create(sessionId, '')).toThrow(
        'CampaignId cannot be empty',
      );
    });
  });

  describe('pingPlayer', () => {
    it('should emit a PlayerPinged event', () => {
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);

      aggregate.pingPlayer(playerId, gmUserId, gmUserId, clock);

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(PlayerPinged);

      const event = events[0] as PlayerPinged;
      expect(event.sessionId).toBe(sessionId);
      expect(event.campaignId).toBe(campaignId);
      expect(event.playerId).toBe(playerId);
      expect(event.gmUserId).toBe(gmUserId);
      expect(event.pingedAt).toBe(fixedDate.toISOString());
    });

    it('should track pinged player IDs', () => {
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);

      aggregate.pingPlayer(playerId, gmUserId, gmUserId, clock);

      expect(aggregate.getPingedPlayerIds()).toContain(playerId);
    });

    it('should allow pinging multiple players', () => {
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);
      const player2 = 'user_player_789';

      aggregate.pingPlayer(playerId, gmUserId, gmUserId, clock);
      aggregate.pingPlayer(player2, gmUserId, gmUserId, clock);

      expect(aggregate.getPingedPlayerIds()).toContain(playerId);
      expect(aggregate.getPingedPlayerIds()).toContain(player2);
      expect(aggregate.getUncommittedEvents()).toHaveLength(2);
    });

    it('should throw NotSessionGmException if callerUserId does not match gmUserId', () => {
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);

      expect(() => aggregate.pingPlayer(playerId, gmUserId, 'other-user', clock)).toThrow(
        NotSessionGmException,
      );
    });

    it('should throw on empty playerId', () => {
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);

      expect(() => aggregate.pingPlayer('', gmUserId, gmUserId, clock)).toThrow(
        'Player ID cannot be empty',
      );
    });

    it('should throw on empty gmUserId', () => {
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);

      expect(() => aggregate.pingPlayer(playerId, '', gmUserId, clock)).toThrow(
        'GM user ID cannot be empty',
      );
    });
  });

  describe('proposeAction', () => {
    it('should emit an ActionProposed event', () => {
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);

      aggregate.proposeAction(actionId, playerId, 'move', 'I move north', null, clock);

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(ActionProposed);

      const event = events[0] as ActionProposed;
      expect(event.actionId).toBe(actionId);
      expect(event.sessionId).toBe(sessionId);
      expect(event.campaignId).toBe(campaignId);
      expect(event.playerId).toBe(playerId);
      expect(event.actionType).toBe('move');
      expect(event.description).toBe('I move north');
      expect(event.target).toBeNull();
      expect(event.proposedAt).toBe(fixedDate.toISOString());
    });

    it('should emit ActionProposed with target when provided', () => {
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);

      aggregate.proposeAction(actionId, playerId, 'attack', 'I attack the goblin', 'token-goblin-1', clock);

      const event = aggregate.getUncommittedEvents()[0] as ActionProposed;
      expect(event.actionType).toBe('attack');
      expect(event.target).toBe('token-goblin-1');
    });

    it('should track pending action IDs', () => {
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);

      aggregate.proposeAction(actionId, playerId, 'free-text', 'I look around', null, clock);

      expect(aggregate.getPendingActionIds()).toContain(actionId);
    });

    it('should accept all valid action types', () => {
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);
      const types = ['move', 'attack', 'interact', 'free-text'];

      types.forEach((type, i) => {
        const id = `${actionId.slice(0, -1)}${i}`;
        aggregate.proposeAction(id, playerId, type, `Action of type ${type}`, null, clock);
      });

      expect(aggregate.getUncommittedEvents()).toHaveLength(4);
    });

    it('should throw on invalid action type', () => {
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);

      expect(() =>
        aggregate.proposeAction(actionId, playerId, 'invalid', 'description', null, clock),
      ).toThrow(InvalidActionProposalException);
    });

    it('should throw on empty description', () => {
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);

      expect(() =>
        aggregate.proposeAction(actionId, playerId, 'move', '', null, clock),
      ).toThrow(InvalidActionProposalException);
    });

    it('should throw on description exceeding 500 characters', () => {
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);
      const longDescription = 'a'.repeat(501);

      expect(() =>
        aggregate.proposeAction(actionId, playerId, 'move', longDescription, null, clock),
      ).toThrow(InvalidActionProposalException);
    });

    it('should throw on empty actionId', () => {
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);

      expect(() =>
        aggregate.proposeAction('', playerId, 'move', 'I move', null, clock),
      ).toThrow('Action ID cannot be empty');
    });

    it('should throw on empty playerId', () => {
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);

      expect(() =>
        aggregate.proposeAction(actionId, '', 'move', 'I move', null, clock),
      ).toThrow('Player ID cannot be empty');
    });

    it('should throw InvalidActionProposalException on duplicate actionId', () => {
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);
      aggregate.proposeAction(actionId, playerId, 'move', 'I move north', null, clock);

      expect(() =>
        aggregate.proposeAction(actionId, playerId, 'move', 'I move south', null, clock),
      ).toThrow(InvalidActionProposalException);
    });

    it('should throw on duplicate actionId from history', () => {
      const aggregate = ActionPipelineAggregate.loadFromHistory(sessionId, [
        {
          type: 'ActionProposed',
          data: {
            actionId,
            sessionId,
            campaignId,
            playerId,
            actionType: 'move',
            description: 'I move north',
            target: null,
            proposedAt: '2026-03-18T10:00:00.000Z',
          },
        },
      ]);

      expect(() =>
        aggregate.proposeAction(actionId, playerId, 'attack', 'I attack', null, clock),
      ).toThrow(InvalidActionProposalException);
    });
  });

  describe('loadFromHistory', () => {
    it('should reconstruct aggregate from PlayerPinged event', () => {
      const events = [
        {
          type: 'PlayerPinged',
          data: {
            sessionId,
            campaignId,
            playerId,
            gmUserId,
            pingedAt: '2026-03-18T10:00:00.000Z',
          },
        },
      ];

      const aggregate = ActionPipelineAggregate.loadFromHistory(sessionId, events);

      expect(aggregate.getSessionId()).toBe(sessionId);
      expect(aggregate.getCampaignId()).toBe(campaignId);
      expect(aggregate.getPingedPlayerIds()).toContain(playerId);
      expect(aggregate.isNew()).toBe(false);
      expect(aggregate.getUncommittedEvents()).toHaveLength(0);
    });

    it('should reconstruct aggregate from ActionProposed event', () => {
      const events = [
        {
          type: 'ActionProposed',
          data: {
            actionId,
            sessionId,
            campaignId,
            playerId,
            actionType: 'move',
            description: 'I move north',
            target: null,
            proposedAt: '2026-03-18T10:05:00.000Z',
          },
        },
      ];

      const aggregate = ActionPipelineAggregate.loadFromHistory(sessionId, events);

      expect(aggregate.getPendingActionIds()).toContain(actionId);
    });

    it('should reconstruct aggregate from mixed events', () => {
      const events = [
        {
          type: 'PlayerPinged',
          data: {
            sessionId,
            campaignId,
            playerId,
            gmUserId,
            pingedAt: '2026-03-18T10:00:00.000Z',
          },
        },
        {
          type: 'ActionProposed',
          data: {
            actionId,
            sessionId,
            campaignId,
            playerId,
            actionType: 'attack',
            description: 'I attack',
            target: 'token-1',
            proposedAt: '2026-03-18T10:01:00.000Z',
          },
        },
      ];

      const aggregate = ActionPipelineAggregate.loadFromHistory(sessionId, events);

      expect(aggregate.getPingedPlayerIds()).toContain(playerId);
      expect(aggregate.getPendingActionIds()).toContain(actionId);
    });

    it('should throw on unknown event type', () => {
      const events = [{ type: 'UnknownEvent', data: {} }];
      expect(() => ActionPipelineAggregate.loadFromHistory(sessionId, events)).toThrow(
        'Unknown event type',
      );
    });

    it('should throw on missing required field in event data', () => {
      const events = [
        {
          type: 'PlayerPinged',
          data: { sessionId },
        },
      ];
      expect(() => ActionPipelineAggregate.loadFromHistory(sessionId, events)).toThrow(
        'Invalid event data',
      );
    });

    it('should allow further operations after loading from history', () => {
      const events = [
        {
          type: 'PlayerPinged',
          data: {
            sessionId,
            campaignId,
            playerId,
            gmUserId,
            pingedAt: '2026-03-18T10:00:00.000Z',
          },
        },
      ];

      const aggregate = ActionPipelineAggregate.loadFromHistory(sessionId, events);
      aggregate.proposeAction(actionId, playerId, 'move', 'I move', null, clock);

      expect(aggregate.getUncommittedEvents()).toHaveLength(1);
      expect(aggregate.getPendingActionIds()).toContain(actionId);
    });
  });

  describe('clearEvents', () => {
    it('should clear uncommitted events', () => {
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);
      aggregate.pingPlayer(playerId, gmUserId, gmUserId, clock);
      expect(aggregate.getUncommittedEvents()).toHaveLength(1);

      aggregate.clearEvents();
      expect(aggregate.getUncommittedEvents()).toHaveLength(0);
    });
  });
});
