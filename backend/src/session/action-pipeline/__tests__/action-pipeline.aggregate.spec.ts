import { ActionPipelineAggregate } from '../action-pipeline.aggregate.js';
import { PlayerPinged } from '../events/player-pinged.event.js';
import { ActionProposed } from '../events/action-proposed.event.js';
import { ActionValidated } from '../events/action-validated.event.js';
import { ActionRejected } from '../events/action-rejected.event.js';
import { ActionQueueReordered } from '../events/action-queue-reordered.event.js';
import { ActionCancelled } from '../events/action-cancelled.event.js';
import { InvalidActionProposalException } from '../exceptions/invalid-action-proposal.exception.js';
import { NotSessionGmException } from '../exceptions/not-session-gm.exception.js';
import { ActionNotFoundException } from '../exceptions/action-not-found.exception.js';
import { ActionNotPendingException } from '../exceptions/action-not-pending.exception.js';
import { NotActionProposerException } from '../exceptions/not-action-proposer.exception.js';
import { FeedbackRequiredException } from '../exceptions/feedback-required.exception.js';
import { InvalidQueueReorderException } from '../exceptions/invalid-queue-reorder.exception.js';
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

  describe('validateAction', () => {
    it('should emit an ActionValidated event for a pending action', () => {
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);
      aggregate.proposeAction(actionId, playerId, 'move', 'I move north', null, clock);
      aggregate.clearEvents();

      aggregate.validateAction(actionId, gmUserId, gmUserId, 'The path opens before you', clock);

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(ActionValidated);

      const event = events[0] as ActionValidated;
      expect(event.actionId).toBe(actionId);
      expect(event.sessionId).toBe(sessionId);
      expect(event.campaignId).toBe(campaignId);
      expect(event.gmUserId).toBe(gmUserId);
      expect(event.narrativeNote).toBe('The path opens before you');
      expect(event.validatedAt).toBe(fixedDate.toISOString());
    });

    it('should validate without narrative note', () => {
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);
      aggregate.proposeAction(actionId, playerId, 'move', 'I move north', null, clock);
      aggregate.clearEvents();

      aggregate.validateAction(actionId, gmUserId, gmUserId, null, clock);

      const event = aggregate.getUncommittedEvents()[0] as ActionValidated;
      expect(event.narrativeNote).toBeNull();
    });

    it('should remove action from pending after validation', () => {
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);
      aggregate.proposeAction(actionId, playerId, 'move', 'I move north', null, clock);

      aggregate.validateAction(actionId, gmUserId, gmUserId, null, clock);

      expect(aggregate.getPendingActionIds()).not.toContain(actionId);
    });

    it('should throw ActionNotFoundException for non-existent action', () => {
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);

      expect(() =>
        aggregate.validateAction('non-existent-id', gmUserId, gmUserId, null, clock),
      ).toThrow(ActionNotFoundException);
    });

    it('should throw ActionNotPendingException for already validated action', () => {
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);
      aggregate.proposeAction(actionId, playerId, 'move', 'I move north', null, clock);
      aggregate.validateAction(actionId, gmUserId, gmUserId, null, clock);

      expect(() =>
        aggregate.validateAction(actionId, gmUserId, gmUserId, null, clock),
      ).toThrow(ActionNotPendingException);
    });

    it('should throw NotSessionGmException if caller is not GM', () => {
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);
      aggregate.proposeAction(actionId, playerId, 'move', 'I move north', null, clock);

      expect(() =>
        aggregate.validateAction(actionId, gmUserId, 'other-user', null, clock),
      ).toThrow(NotSessionGmException);
    });

    it('should trim narrative note before storing', () => {
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);
      aggregate.proposeAction(actionId, playerId, 'move', 'I move north', null, clock);
      aggregate.clearEvents();

      aggregate.validateAction(actionId, gmUserId, gmUserId, '  The path opens  ', clock);

      const event = aggregate.getUncommittedEvents()[0] as ActionValidated;
      expect(event.narrativeNote).toBe('The path opens');
    });

    it('should treat whitespace-only narrative note as null', () => {
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);
      aggregate.proposeAction(actionId, playerId, 'move', 'I move north', null, clock);
      aggregate.clearEvents();

      aggregate.validateAction(actionId, gmUserId, gmUserId, '   ', clock);

      const event = aggregate.getUncommittedEvents()[0] as ActionValidated;
      expect(event.narrativeNote).toBeNull();
    });

    it('should throw on narrative note exceeding max length', () => {
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);
      aggregate.proposeAction(actionId, playerId, 'move', 'I move north', null, clock);
      const longNote = 'a'.repeat(1001);

      expect(() =>
        aggregate.validateAction(actionId, gmUserId, gmUserId, longNote, clock),
      ).toThrow('Narrative note exceeds maximum length');
    });
  });

  describe('rejectAction', () => {
    it('should emit an ActionRejected event for a pending action', () => {
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);
      aggregate.proposeAction(actionId, playerId, 'attack', 'I attack the dragon', null, clock);
      aggregate.clearEvents();

      aggregate.rejectAction(actionId, gmUserId, gmUserId, 'The dragon is too far away', clock);

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(ActionRejected);

      const event = events[0] as ActionRejected;
      expect(event.actionId).toBe(actionId);
      expect(event.sessionId).toBe(sessionId);
      expect(event.campaignId).toBe(campaignId);
      expect(event.gmUserId).toBe(gmUserId);
      expect(event.feedback).toBe('The dragon is too far away');
      expect(event.rejectedAt).toBe(fixedDate.toISOString());
    });

    it('should remove action from pending after rejection', () => {
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);
      aggregate.proposeAction(actionId, playerId, 'move', 'I move north', null, clock);

      aggregate.rejectAction(actionId, gmUserId, gmUserId, 'Not allowed', clock);

      expect(aggregate.getPendingActionIds()).not.toContain(actionId);
    });

    it('should throw FeedbackRequiredException when feedback is empty', () => {
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);
      aggregate.proposeAction(actionId, playerId, 'move', 'I move north', null, clock);

      expect(() =>
        aggregate.rejectAction(actionId, gmUserId, gmUserId, '', clock),
      ).toThrow(FeedbackRequiredException);
    });

    it('should throw FeedbackRequiredException when feedback is whitespace', () => {
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);
      aggregate.proposeAction(actionId, playerId, 'move', 'I move north', null, clock);

      expect(() =>
        aggregate.rejectAction(actionId, gmUserId, gmUserId, '   ', clock),
      ).toThrow(FeedbackRequiredException);
    });

    it('should throw ActionNotFoundException for non-existent action', () => {
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);

      expect(() =>
        aggregate.rejectAction('non-existent-id', gmUserId, gmUserId, 'reason', clock),
      ).toThrow(ActionNotFoundException);
    });

    it('should throw ActionNotPendingException for already rejected action', () => {
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);
      aggregate.proposeAction(actionId, playerId, 'move', 'I move north', null, clock);
      aggregate.rejectAction(actionId, gmUserId, gmUserId, 'Not allowed', clock);

      expect(() =>
        aggregate.rejectAction(actionId, gmUserId, gmUserId, 'Still not allowed', clock),
      ).toThrow(ActionNotPendingException);
    });

    it('should throw NotSessionGmException if caller is not GM', () => {
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);
      aggregate.proposeAction(actionId, playerId, 'move', 'I move north', null, clock);

      expect(() =>
        aggregate.rejectAction(actionId, gmUserId, 'other-user', 'reason', clock),
      ).toThrow(NotSessionGmException);
    });

    it('should throw on feedback exceeding max length', () => {
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);
      aggregate.proposeAction(actionId, playerId, 'move', 'I move north', null, clock);
      const longFeedback = 'a'.repeat(1001);

      expect(() =>
        aggregate.rejectAction(actionId, gmUserId, gmUserId, longFeedback, clock),
      ).toThrow('Feedback exceeds maximum length');
    });

    it('should trim feedback before storing', () => {
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);
      aggregate.proposeAction(actionId, playerId, 'move', 'I move north', null, clock);
      aggregate.clearEvents();

      aggregate.rejectAction(actionId, gmUserId, gmUserId, '  Too far away  ', clock);

      const event = aggregate.getUncommittedEvents()[0] as ActionRejected;
      expect(event.feedback).toBe('Too far away');
    });
  });

  describe('loadFromHistory with validation/rejection events', () => {
    it('should reconstruct aggregate from ActionValidated event', () => {
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
            proposedAt: '2026-03-18T10:00:00.000Z',
          },
        },
        {
          type: 'ActionValidated',
          data: {
            actionId,
            sessionId,
            campaignId,
            gmUserId,
            narrativeNote: 'Well done',
            validatedAt: '2026-03-18T10:01:00.000Z',
          },
        },
      ];

      const aggregate = ActionPipelineAggregate.loadFromHistory(sessionId, events);

      expect(aggregate.getPendingActionIds()).not.toContain(actionId);
    });

    it('should reconstruct aggregate from ActionRejected event', () => {
      const events = [
        {
          type: 'ActionProposed',
          data: {
            actionId,
            sessionId,
            campaignId,
            playerId,
            actionType: 'attack',
            description: 'I attack',
            target: null,
            proposedAt: '2026-03-18T10:00:00.000Z',
          },
        },
        {
          type: 'ActionRejected',
          data: {
            actionId,
            sessionId,
            campaignId,
            gmUserId,
            feedback: 'Not allowed',
            rejectedAt: '2026-03-18T10:01:00.000Z',
          },
        },
      ];

      const aggregate = ActionPipelineAggregate.loadFromHistory(sessionId, events);

      expect(aggregate.getPendingActionIds()).not.toContain(actionId);
    });

    it('should prevent validation of rejected action from history', () => {
      const events = [
        {
          type: 'ActionProposed',
          data: {
            actionId,
            sessionId,
            campaignId,
            playerId,
            actionType: 'move',
            description: 'I move',
            target: null,
            proposedAt: '2026-03-18T10:00:00.000Z',
          },
        },
        {
          type: 'ActionRejected',
          data: {
            actionId,
            sessionId,
            campaignId,
            gmUserId,
            feedback: 'Not allowed',
            rejectedAt: '2026-03-18T10:01:00.000Z',
          },
        },
      ];

      const aggregate = ActionPipelineAggregate.loadFromHistory(sessionId, events);

      expect(() =>
        aggregate.validateAction(actionId, gmUserId, gmUserId, null, clock),
      ).toThrow(ActionNotPendingException);
    });

    it('should prevent rejection of validated action from history', () => {
      const events = [
        {
          type: 'ActionProposed',
          data: {
            actionId,
            sessionId,
            campaignId,
            playerId,
            actionType: 'move',
            description: 'I move',
            target: null,
            proposedAt: '2026-03-18T10:00:00.000Z',
          },
        },
        {
          type: 'ActionValidated',
          data: {
            actionId,
            sessionId,
            campaignId,
            gmUserId,
            narrativeNote: null,
            validatedAt: '2026-03-18T10:01:00.000Z',
          },
        },
      ];

      const aggregate = ActionPipelineAggregate.loadFromHistory(sessionId, events);

      expect(() =>
        aggregate.rejectAction(actionId, gmUserId, gmUserId, 'reason', clock),
      ).toThrow(ActionNotPendingException);
    });

    it('should prevent re-validation of validated action from history', () => {
      const events = [
        {
          type: 'ActionProposed',
          data: {
            actionId,
            sessionId,
            campaignId,
            playerId,
            actionType: 'move',
            description: 'I move',
            target: null,
            proposedAt: '2026-03-18T10:00:00.000Z',
          },
        },
        {
          type: 'ActionValidated',
          data: {
            actionId,
            sessionId,
            campaignId,
            gmUserId,
            narrativeNote: null,
            validatedAt: '2026-03-18T10:01:00.000Z',
          },
        },
      ];

      const aggregate = ActionPipelineAggregate.loadFromHistory(sessionId, events);

      expect(() =>
        aggregate.validateAction(actionId, gmUserId, gmUserId, null, clock),
      ).toThrow(ActionNotPendingException);
    });
  });

  describe('reorderActionQueue', () => {
    const actionId2 = '770e8400-e29b-41d4-a716-446655440003';
    const actionId3 = '770e8400-e29b-41d4-a716-446655440004';

    it('should emit an ActionQueueReordered event with new order', () => {
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);
      aggregate.proposeAction(actionId, playerId, 'move', 'I move north', null, clock);
      aggregate.proposeAction(actionId2, playerId, 'attack', 'I attack', null, clock);
      aggregate.proposeAction(actionId3, playerId, 'interact', 'I interact', null, clock);
      aggregate.clearEvents();

      aggregate.reorderActionQueue([actionId3, actionId, actionId2], gmUserId, gmUserId, clock);

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(ActionQueueReordered);

      const event = events[0] as ActionQueueReordered;
      expect(event.sessionId).toBe(sessionId);
      expect(event.campaignId).toBe(campaignId);
      expect(event.orderedActionIds).toEqual([actionId3, actionId, actionId2]);
      expect(event.gmUserId).toBe(gmUserId);
      expect(event.reorderedAt).toBe(fixedDate.toISOString());
    });

    it('should update pendingActionIds order after reorder', () => {
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);
      aggregate.proposeAction(actionId, playerId, 'move', 'I move north', null, clock);
      aggregate.proposeAction(actionId2, playerId, 'attack', 'I attack', null, clock);

      aggregate.reorderActionQueue([actionId2, actionId], gmUserId, gmUserId, clock);

      expect(aggregate.getPendingActionIds()).toEqual([actionId2, actionId]);
    });

    it('should throw NotSessionGmException if caller is not GM', () => {
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);
      aggregate.proposeAction(actionId, playerId, 'move', 'I move', null, clock);

      expect(() =>
        aggregate.reorderActionQueue([actionId], gmUserId, 'other-user', clock),
      ).toThrow(NotSessionGmException);
    });

    it('should throw InvalidQueueReorderException for empty queue', () => {
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);

      expect(() =>
        aggregate.reorderActionQueue([], gmUserId, gmUserId, clock),
      ).toThrow(InvalidQueueReorderException);
    });

    it('should throw InvalidQueueReorderException for mismatched action IDs (extra ID)', () => {
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);
      aggregate.proposeAction(actionId, playerId, 'move', 'I move', null, clock);

      expect(() =>
        aggregate.reorderActionQueue([actionId, actionId2], gmUserId, gmUserId, clock),
      ).toThrow(InvalidQueueReorderException);
    });

    it('should throw InvalidQueueReorderException for mismatched action IDs (wrong ID)', () => {
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);
      aggregate.proposeAction(actionId, playerId, 'move', 'I move', null, clock);
      aggregate.proposeAction(actionId2, playerId, 'attack', 'I attack', null, clock);

      expect(() =>
        aggregate.reorderActionQueue([actionId, actionId3], gmUserId, gmUserId, clock),
      ).toThrow(InvalidQueueReorderException);
    });

    it('should throw InvalidQueueReorderException for incomplete list (missing ID)', () => {
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);
      aggregate.proposeAction(actionId, playerId, 'move', 'I move', null, clock);
      aggregate.proposeAction(actionId2, playerId, 'attack', 'I attack', null, clock);

      expect(() =>
        aggregate.reorderActionQueue([actionId], gmUserId, gmUserId, clock),
      ).toThrow(InvalidQueueReorderException);
    });

    it('should allow propose after reorder and append at end', () => {
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);
      aggregate.proposeAction(actionId, playerId, 'move', 'I move', null, clock);
      aggregate.proposeAction(actionId2, playerId, 'attack', 'I attack', null, clock);
      aggregate.reorderActionQueue([actionId2, actionId], gmUserId, gmUserId, clock);

      aggregate.proposeAction(actionId3, playerId, 'interact', 'I interact', null, clock);

      expect(aggregate.getPendingActionIds()).toEqual([actionId2, actionId, actionId3]);
    });

    it('should preserve remaining order after validate following reorder', () => {
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);
      aggregate.proposeAction(actionId, playerId, 'move', 'I move', null, clock);
      aggregate.proposeAction(actionId2, playerId, 'attack', 'I attack', null, clock);
      aggregate.proposeAction(actionId3, playerId, 'interact', 'I interact', null, clock);
      aggregate.reorderActionQueue([actionId3, actionId, actionId2], gmUserId, gmUserId, clock);

      aggregate.validateAction(actionId, gmUserId, gmUserId, null, clock);

      expect(aggregate.getPendingActionIds()).toEqual([actionId3, actionId2]);
    });
  });

  describe('cancelAction', () => {
    it('should emit an ActionCancelled event for a pending action', () => {
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);
      aggregate.proposeAction(actionId, playerId, 'move', 'I move north', null, clock);
      aggregate.clearEvents();

      aggregate.cancelAction(actionId, playerId, playerId, clock);

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(ActionCancelled);

      const event = events[0] as ActionCancelled;
      expect(event.actionId).toBe(actionId);
      expect(event.sessionId).toBe(sessionId);
      expect(event.campaignId).toBe(campaignId);
      expect(event.playerId).toBe(playerId);
      expect(event.cancelledAt).toBe(fixedDate.toISOString());
    });

    it('should remove action from pending after cancellation', () => {
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);
      aggregate.proposeAction(actionId, playerId, 'move', 'I move north', null, clock);

      aggregate.cancelAction(actionId, playerId, playerId, clock);

      expect(aggregate.getPendingActionIds()).not.toContain(actionId);
    });

    it('should throw NotActionProposerException if caller is not the proposer', () => {
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);
      aggregate.proposeAction(actionId, playerId, 'move', 'I move north', null, clock);

      expect(() =>
        aggregate.cancelAction(actionId, playerId, 'other-user', clock),
      ).toThrow(NotActionProposerException);
    });

    it('should throw NotActionProposerException if callerUserId does not match playerId', () => {
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);
      aggregate.proposeAction(actionId, playerId, 'move', 'I move north', null, clock);

      expect(() =>
        aggregate.cancelAction(actionId, 'other-player', 'other-player', clock),
      ).toThrow(NotActionProposerException);
    });

    it('should throw ActionNotPendingException for already validated action', () => {
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);
      aggregate.proposeAction(actionId, playerId, 'move', 'I move north', null, clock);
      aggregate.validateAction(actionId, gmUserId, gmUserId, null, clock);

      expect(() =>
        aggregate.cancelAction(actionId, playerId, playerId, clock),
      ).toThrow(ActionNotPendingException);
    });

    it('should throw ActionNotPendingException for already rejected action', () => {
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);
      aggregate.proposeAction(actionId, playerId, 'move', 'I move north', null, clock);
      aggregate.rejectAction(actionId, gmUserId, gmUserId, 'Not allowed', clock);

      expect(() =>
        aggregate.cancelAction(actionId, playerId, playerId, clock),
      ).toThrow(ActionNotPendingException);
    });

    it('should throw ActionNotFoundException for non-existent action', () => {
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);

      expect(() =>
        aggregate.cancelAction('non-existent-id', playerId, playerId, clock),
      ).toThrow(ActionNotFoundException);
    });

    it('should preserve queue order for remaining actions after cancel', () => {
      const actionId2 = '770e8400-e29b-41d4-a716-446655440003';
      const actionId3 = '770e8400-e29b-41d4-a716-446655440004';
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);
      aggregate.proposeAction(actionId, playerId, 'move', 'I move north', null, clock);
      aggregate.proposeAction(actionId2, playerId, 'attack', 'I attack', null, clock);
      aggregate.proposeAction(actionId3, playerId, 'interact', 'I interact', null, clock);

      aggregate.cancelAction(actionId2, playerId, playerId, clock);

      expect(aggregate.getPendingActionIds()).toEqual([actionId, actionId3]);
    });

    it('should allow proposing a new action after cancellation', () => {
      const newActionId = '770e8400-e29b-41d4-a716-446655440005';
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);
      aggregate.proposeAction(actionId, playerId, 'move', 'I move north', null, clock);
      aggregate.cancelAction(actionId, playerId, playerId, clock);

      aggregate.proposeAction(newActionId, playerId, 'attack', 'I attack', null, clock);

      expect(aggregate.getPendingActionIds()).toContain(newActionId);
      expect(aggregate.getPendingActionIds()).not.toContain(actionId);
    });
  });

  describe('loadFromHistory with ActionCancelled', () => {
    it('should reconstruct aggregate from ActionCancelled event', () => {
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
            proposedAt: '2026-03-18T10:00:00.000Z',
          },
        },
        {
          type: 'ActionCancelled',
          data: {
            actionId,
            sessionId,
            campaignId,
            playerId,
            cancelledAt: '2026-03-18T10:01:00.000Z',
          },
        },
      ];

      const aggregate = ActionPipelineAggregate.loadFromHistory(sessionId, events);

      expect(aggregate.getPendingActionIds()).not.toContain(actionId);
    });

    it('should prevent cancellation of already-cancelled action from history', () => {
      const events = [
        {
          type: 'ActionProposed',
          data: {
            actionId,
            sessionId,
            campaignId,
            playerId,
            actionType: 'move',
            description: 'I move',
            target: null,
            proposedAt: '2026-03-18T10:00:00.000Z',
          },
        },
        {
          type: 'ActionCancelled',
          data: {
            actionId,
            sessionId,
            campaignId,
            playerId,
            cancelledAt: '2026-03-18T10:01:00.000Z',
          },
        },
      ];

      const aggregate = ActionPipelineAggregate.loadFromHistory(sessionId, events);

      expect(() =>
        aggregate.cancelAction(actionId, playerId, playerId, clock),
      ).toThrow(ActionNotPendingException);
    });
  });

  describe('loadFromHistory with ActionQueueReordered', () => {
    const actionId2 = '770e8400-e29b-41d4-a716-446655440003';

    it('should reconstruct aggregate from ActionQueueReordered event', () => {
      const events = [
        {
          type: 'ActionProposed',
          data: {
            actionId,
            sessionId,
            campaignId,
            playerId,
            actionType: 'move',
            description: 'I move',
            target: null,
            proposedAt: '2026-03-18T10:00:00.000Z',
          },
        },
        {
          type: 'ActionProposed',
          data: {
            actionId: actionId2,
            sessionId,
            campaignId,
            playerId,
            actionType: 'attack',
            description: 'I attack',
            target: null,
            proposedAt: '2026-03-18T10:01:00.000Z',
          },
        },
        {
          type: 'ActionQueueReordered',
          data: {
            sessionId,
            campaignId,
            orderedActionIds: [actionId2, actionId],
            gmUserId,
            reorderedAt: '2026-03-18T10:02:00.000Z',
          },
        },
      ];

      const aggregate = ActionPipelineAggregate.loadFromHistory(sessionId, events);

      expect(aggregate.getPendingActionIds()).toEqual([actionId2, actionId]);
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
