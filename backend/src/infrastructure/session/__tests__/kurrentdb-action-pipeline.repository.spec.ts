import { KurrentDbActionPipelineRepository } from '../kurrentdb-action-pipeline.repository.js';
import { ActionPipelineAggregate } from '../../../session/action-pipeline/action-pipeline.aggregate.js';
import type { Clock } from '../../../shared/clock.js';

describe('KurrentDbActionPipelineRepository', () => {
  const sessionId = '550e8400-e29b-41d4-a716-446655440000';
  const campaignId = '660e8400-e29b-41d4-a716-446655440001';
  const gmUserId = 'user_gm_123';
  const playerId = 'user_player_456';
  const actionId = '770e8400-e29b-41d4-a716-446655440002';
  const fixedDate = new Date('2026-03-18T10:00:00.000Z');
  const clock: Clock = { now: () => fixedDate };

  let mockKurrentDb: {
    appendEventsToNewStream: jest.Mock;
    appendEventsToStream: jest.Mock;
    readStream: jest.Mock;
  };
  let repository: KurrentDbActionPipelineRepository;

  beforeEach(() => {
    mockKurrentDb = {
      appendEventsToNewStream: jest.fn().mockResolvedValue(undefined),
      appendEventsToStream: jest.fn().mockResolvedValue(undefined),
      readStream: jest.fn(),
    };

    repository = new KurrentDbActionPipelineRepository(
      mockKurrentDb as any,
      clock,
    );
  });

  describe('saveNew', () => {
    it('should serialize PlayerPinged event correctly', async () => {
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);
      aggregate.pingPlayer(playerId, gmUserId, gmUserId, clock);

      await repository.saveNew(aggregate);

      expect(mockKurrentDb.appendEventsToNewStream).toHaveBeenCalledTimes(1);
      const [streamName, events] = mockKurrentDb.appendEventsToNewStream.mock.calls[0];
      expect(streamName).toBe(`action-pipeline-${sessionId}`);
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('PlayerPinged');
      expect(events[0].data).toEqual({
        sessionId,
        campaignId,
        playerId,
        gmUserId,
        pingedAt: fixedDate.toISOString(),
      });
    });

    it('should serialize ActionProposed event correctly', async () => {
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);
      aggregate.proposeAction(actionId, playerId, 'move', 'I move north', 'pos-1', clock);

      await repository.saveNew(aggregate);

      const events = mockKurrentDb.appendEventsToNewStream.mock.calls[0][1];
      expect(events[0].eventType).toBe('ActionProposed');
      expect(events[0].data).toEqual({
        actionId,
        sessionId,
        campaignId,
        playerId,
        actionType: 'move',
        description: 'I move north',
        target: 'pos-1',
        proposedAt: fixedDate.toISOString(),
      });
    });

    it('should serialize ActionValidated event correctly', async () => {
      const aggregate = ActionPipelineAggregate.loadFromHistory(sessionId, [
        {
          type: 'ActionProposed',
          data: {
            actionId, sessionId, campaignId, playerId,
            actionType: 'move', description: 'I move', target: null,
            proposedAt: '2026-03-18T09:00:00.000Z',
          },
        },
      ]);
      aggregate.validateAction(actionId, gmUserId, gmUserId, 'Well done', clock);

      await repository.save(aggregate);

      const events = mockKurrentDb.appendEventsToStream.mock.calls[0][1];
      expect(events[0].eventType).toBe('ActionValidated');
      expect(events[0].data).toEqual({
        actionId,
        sessionId,
        campaignId,
        gmUserId,
        narrativeNote: 'Well done',
        validatedAt: fixedDate.toISOString(),
      });
    });

    it('should serialize ActionValidated event with null narrative note', async () => {
      const aggregate = ActionPipelineAggregate.loadFromHistory(sessionId, [
        {
          type: 'ActionProposed',
          data: {
            actionId, sessionId, campaignId, playerId,
            actionType: 'move', description: 'I move', target: null,
            proposedAt: '2026-03-18T09:00:00.000Z',
          },
        },
      ]);
      aggregate.validateAction(actionId, gmUserId, gmUserId, null, clock);

      await repository.save(aggregate);

      const events = mockKurrentDb.appendEventsToStream.mock.calls[0][1];
      expect(events[0].data.narrativeNote).toBeNull();
    });

    it('should serialize ActionRejected event correctly', async () => {
      const aggregate = ActionPipelineAggregate.loadFromHistory(sessionId, [
        {
          type: 'ActionProposed',
          data: {
            actionId, sessionId, campaignId, playerId,
            actionType: 'attack', description: 'I attack', target: null,
            proposedAt: '2026-03-18T09:00:00.000Z',
          },
        },
      ]);
      aggregate.rejectAction(actionId, gmUserId, gmUserId, 'Too far away', clock);

      await repository.save(aggregate);

      const events = mockKurrentDb.appendEventsToStream.mock.calls[0][1];
      expect(events[0].eventType).toBe('ActionRejected');
      expect(events[0].data).toEqual({
        actionId,
        sessionId,
        campaignId,
        gmUserId,
        feedback: 'Too far away',
        rejectedAt: fixedDate.toISOString(),
      });
    });

    it('should include metadata with correlationId, timestamp, sessionId, campaignId', async () => {
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);
      aggregate.pingPlayer(playerId, gmUserId, gmUserId, clock);

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
      const aggregate = ActionPipelineAggregate.create(sessionId, campaignId);
      aggregate.pingPlayer(playerId, gmUserId, gmUserId, clock);

      await repository.saveNew(aggregate);

      expect(aggregate.getUncommittedEvents()).toHaveLength(0);
    });
  });

  describe('save', () => {
    it('should append to existing stream', async () => {
      const aggregate = ActionPipelineAggregate.loadFromHistory(sessionId, [
        {
          type: 'PlayerPinged',
          data: { sessionId, campaignId, playerId: 'other', gmUserId, pingedAt: fixedDate.toISOString() },
        },
      ]);
      aggregate.proposeAction(actionId, playerId, 'attack', 'I attack', null, clock);

      await repository.save(aggregate);

      expect(mockKurrentDb.appendEventsToStream).toHaveBeenCalledTimes(1);
      const [streamName, events] = mockKurrentDb.appendEventsToStream.mock.calls[0];
      expect(streamName).toBe(`action-pipeline-${sessionId}`);
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('ActionProposed');
    });

    it('should clear events after save', async () => {
      const aggregate = ActionPipelineAggregate.loadFromHistory(sessionId, [
        {
          type: 'PlayerPinged',
          data: { sessionId, campaignId, playerId, gmUserId, pingedAt: fixedDate.toISOString() },
        },
      ]);
      aggregate.pingPlayer('player2', gmUserId, gmUserId, clock);

      await repository.save(aggregate);

      expect(aggregate.getUncommittedEvents()).toHaveLength(0);
    });
  });

  describe('load', () => {
    it('should reconstruct aggregate from events', async () => {
      mockKurrentDb.readStream.mockResolvedValue([
        {
          type: 'PlayerPinged',
          data: { sessionId, campaignId, playerId, gmUserId, pingedAt: fixedDate.toISOString() },
        },
        {
          type: 'ActionProposed',
          data: {
            actionId, sessionId, campaignId, playerId,
            actionType: 'move', description: 'I move', target: null,
            proposedAt: '2026-03-18T10:05:00.000Z',
          },
        },
      ]);

      const aggregate = await repository.load(sessionId);

      expect(aggregate.getSessionId()).toBe(sessionId);
      expect(aggregate.getCampaignId()).toBe(campaignId);
      expect(aggregate.getPingedPlayerIds()).toContain(playerId);
      expect(aggregate.getPendingActionIds()).toContain(actionId);
    });

    it('should reconstruct aggregate with validated and rejected actions', async () => {
      const actionId2 = '880e8400-e29b-41d4-a716-446655440003';
      mockKurrentDb.readStream.mockResolvedValue([
        {
          type: 'ActionProposed',
          data: {
            actionId, sessionId, campaignId, playerId,
            actionType: 'move', description: 'I move', target: null,
            proposedAt: '2026-03-18T10:00:00.000Z',
          },
        },
        {
          type: 'ActionProposed',
          data: {
            actionId: actionId2, sessionId, campaignId, playerId,
            actionType: 'attack', description: 'I attack', target: null,
            proposedAt: '2026-03-18T10:01:00.000Z',
          },
        },
        {
          type: 'ActionValidated',
          data: {
            actionId, sessionId, campaignId, gmUserId,
            narrativeNote: 'OK',
            validatedAt: '2026-03-18T10:02:00.000Z',
          },
        },
        {
          type: 'ActionRejected',
          data: {
            actionId: actionId2, sessionId, campaignId, gmUserId,
            feedback: 'No',
            rejectedAt: '2026-03-18T10:03:00.000Z',
          },
        },
      ]);

      const aggregate = await repository.load(sessionId);

      expect(aggregate.getPendingActionIds()).toHaveLength(0);
    });

    it('should use correct stream name', async () => {
      mockKurrentDb.readStream.mockResolvedValue([]);

      try {
        await repository.load(sessionId);
      } catch {
        // empty stream might throw, that's ok
      }

      expect(mockKurrentDb.readStream).toHaveBeenCalledWith(`action-pipeline-${sessionId}`);
    });
  });

  describe('loadOrCreate', () => {
    it('should load existing aggregate when stream exists', async () => {
      mockKurrentDb.readStream.mockResolvedValue([
        {
          type: 'PlayerPinged',
          data: { sessionId, campaignId, playerId, gmUserId, pingedAt: fixedDate.toISOString() },
        },
      ]);

      const aggregate = await repository.loadOrCreate(sessionId, campaignId);

      expect(aggregate.isNew()).toBe(false);
      expect(aggregate.getPingedPlayerIds()).toContain(playerId);
    });

    it('should create new aggregate when stream not found', async () => {
      mockKurrentDb.readStream.mockRejectedValue(new Error('Stream not found'));

      const aggregate = await repository.loadOrCreate(sessionId, campaignId);

      expect(aggregate.isNew()).toBe(true);
      expect(aggregate.getSessionId()).toBe(sessionId);
      expect(aggregate.getCampaignId()).toBe(campaignId);
    });

    it('should rethrow unexpected errors', async () => {
      mockKurrentDb.readStream.mockRejectedValue(new Error('Connection timeout'));

      await expect(repository.loadOrCreate(sessionId, campaignId)).rejects.toThrow(
        'Connection timeout',
      );
    });
  });

  describe('ActionCancelled serialization', () => {
    it('should serialize ActionCancelled event correctly', async () => {
      const aggregate = ActionPipelineAggregate.loadFromHistory(sessionId, [
        {
          type: 'ActionProposed',
          data: {
            actionId, sessionId, campaignId, playerId,
            actionType: 'move', description: 'I move', target: null,
            proposedAt: '2026-03-18T09:00:00.000Z',
          },
        },
      ]);
      aggregate.cancelAction(actionId, playerId, playerId, clock);

      await repository.save(aggregate);

      const events = mockKurrentDb.appendEventsToStream.mock.calls[0][1];
      expect(events[0].eventType).toBe('ActionCancelled');
      expect(events[0].data).toEqual({
        actionId,
        sessionId,
        campaignId,
        playerId,
        cancelledAt: fixedDate.toISOString(),
      });
    });

    it('should round-trip ActionCancelled through load', async () => {
      mockKurrentDb.readStream.mockResolvedValue([
        {
          type: 'ActionProposed',
          data: {
            actionId, sessionId, campaignId, playerId,
            actionType: 'move', description: 'I move', target: null,
            proposedAt: '2026-03-18T09:00:00.000Z',
          },
        },
        {
          type: 'ActionCancelled',
          data: {
            actionId, sessionId, campaignId, playerId,
            cancelledAt: '2026-03-18T10:00:00.000Z',
          },
        },
      ]);

      const aggregate = await repository.load(sessionId);

      expect(aggregate.getPendingActionIds()).not.toContain(actionId);
    });
  });

  describe('ActionQueueReordered serialization', () => {
    const actionId2 = '880e8400-e29b-41d4-a716-446655440003';

    it('should serialize ActionQueueReordered event correctly', async () => {
      const aggregate = ActionPipelineAggregate.loadFromHistory(sessionId, [
        {
          type: 'ActionProposed',
          data: {
            actionId, sessionId, campaignId, playerId,
            actionType: 'move', description: 'I move', target: null,
            proposedAt: '2026-03-18T09:00:00.000Z',
          },
        },
        {
          type: 'ActionProposed',
          data: {
            actionId: actionId2, sessionId, campaignId, playerId,
            actionType: 'attack', description: 'I attack', target: null,
            proposedAt: '2026-03-18T09:01:00.000Z',
          },
        },
      ]);
      aggregate.reorderActionQueue([actionId2, actionId], gmUserId, gmUserId, clock);

      await repository.save(aggregate);

      const events = mockKurrentDb.appendEventsToStream.mock.calls[0][1];
      expect(events[0].eventType).toBe('ActionQueueReordered');
      expect(events[0].data).toEqual({
        sessionId,
        campaignId,
        orderedActionIds: [actionId2, actionId],
        gmUserId,
        reorderedAt: fixedDate.toISOString(),
      });
    });

    it('should round-trip ActionQueueReordered through load', async () => {
      mockKurrentDb.readStream.mockResolvedValue([
        {
          type: 'ActionProposed',
          data: {
            actionId, sessionId, campaignId, playerId,
            actionType: 'move', description: 'I move', target: null,
            proposedAt: '2026-03-18T09:00:00.000Z',
          },
        },
        {
          type: 'ActionProposed',
          data: {
            actionId: actionId2, sessionId, campaignId, playerId,
            actionType: 'attack', description: 'I attack', target: null,
            proposedAt: '2026-03-18T09:01:00.000Z',
          },
        },
        {
          type: 'ActionQueueReordered',
          data: {
            sessionId,
            campaignId,
            orderedActionIds: [actionId2, actionId],
            gmUserId,
            reorderedAt: '2026-03-18T10:00:00.000Z',
          },
        },
      ]);

      const aggregate = await repository.load(sessionId);

      expect(aggregate.getPendingActionIds()).toEqual([actionId2, actionId]);
    });
  });
});
