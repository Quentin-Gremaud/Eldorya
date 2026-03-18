import { ReorderActionQueueHandler } from '../commands/reorder-action-queue.handler.js';
import { ReorderActionQueueCommand } from '../commands/reorder-action-queue.command.js';
import { ActionPipelineAggregate } from '../action-pipeline.aggregate.js';
import { SessionNotLiveException } from '../exceptions/session-not-live.exception.js';
import { NotSessionGmException } from '../exceptions/not-session-gm.exception.js';
import { InvalidQueueReorderException } from '../exceptions/invalid-queue-reorder.exception.js';
import type { ActionPipelineRepository } from '../action-pipeline.repository.js';
import type { SessionLivenessChecker } from '../session-liveness-checker.port.js';
import type { Clock } from '../../../shared/clock.js';

describe('ReorderActionQueueHandler', () => {
  let handler: ReorderActionQueueHandler;
  let mockRepository: {
    saveNew: jest.Mock;
    save: jest.Mock;
    load: jest.Mock;
    loadOrCreate: jest.Mock;
  };
  let mockClock: Clock;
  let mockSessionLivenessChecker: { getLiveSession: jest.Mock };

  const sessionId = '550e8400-e29b-41d4-a716-446655440000';
  const campaignId = '660e8400-e29b-41d4-a716-446655440001';
  const gmUserId = 'user_gm_123';
  const playerId = 'user_player_456';
  const actionId1 = '770e8400-e29b-41d4-a716-446655440002';
  const actionId2 = '770e8400-e29b-41d4-a716-446655440003';

  const liveSessionInfo = {
    sessionId,
    campaignId,
    gmUserId,
  };

  beforeEach(() => {
    mockClock = {
      now: jest.fn().mockReturnValue(new Date('2026-03-18T12:00:00.000Z')),
    };

    mockRepository = {
      saveNew: jest.fn().mockResolvedValue(undefined),
      save: jest.fn().mockResolvedValue(undefined),
      load: jest.fn(),
      loadOrCreate: jest.fn(),
    };

    mockSessionLivenessChecker = {
      getLiveSession: jest.fn().mockResolvedValue(liveSessionInfo),
    };

    handler = new ReorderActionQueueHandler(
      mockRepository as unknown as ActionPipelineRepository,
      mockClock,
      mockSessionLivenessChecker as unknown as SessionLivenessChecker,
    );
  });

  function aggregateWithTwoPendingActions(): ActionPipelineAggregate {
    return ActionPipelineAggregate.loadFromHistory(sessionId, [
      {
        type: 'ActionProposed',
        data: {
          actionId: actionId1, sessionId, campaignId, playerId,
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
    ]);
  }

  it('should reorder action queue and save aggregate', async () => {
    mockRepository.loadOrCreate.mockResolvedValue(aggregateWithTwoPendingActions());

    const command = new ReorderActionQueueCommand(
      sessionId, campaignId, [actionId2, actionId1], gmUserId,
    );
    await handler.execute(command);

    expect(mockSessionLivenessChecker.getLiveSession).toHaveBeenCalledWith(sessionId, campaignId);
    expect(mockRepository.loadOrCreate).toHaveBeenCalledWith(sessionId, campaignId);
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
  });

  it('should throw SessionNotLiveException when session is not live', async () => {
    mockSessionLivenessChecker.getLiveSession.mockResolvedValue(null);

    const command = new ReorderActionQueueCommand(
      sessionId, campaignId, [actionId1], gmUserId,
    );
    await expect(handler.execute(command)).rejects.toThrow(SessionNotLiveException);
    expect(mockRepository.loadOrCreate).not.toHaveBeenCalled();
  });

  it('should throw NotSessionGmException when caller is not GM', async () => {
    mockRepository.loadOrCreate.mockResolvedValue(aggregateWithTwoPendingActions());

    const command = new ReorderActionQueueCommand(
      sessionId, campaignId, [actionId2, actionId1], 'other-user',
    );
    await expect(handler.execute(command)).rejects.toThrow(NotSessionGmException);
    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('should throw InvalidQueueReorderException for empty queue', async () => {
    const emptyAggregate = ActionPipelineAggregate.create(sessionId, campaignId);
    mockRepository.loadOrCreate.mockResolvedValue(emptyAggregate);

    const command = new ReorderActionQueueCommand(
      sessionId, campaignId, [], gmUserId,
    );
    await expect(handler.execute(command)).rejects.toThrow(InvalidQueueReorderException);
  });
});
