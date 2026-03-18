import { ValidateActionHandler } from '../commands/validate-action.handler.js';
import { ValidateActionCommand } from '../commands/validate-action.command.js';
import { ActionPipelineAggregate } from '../action-pipeline.aggregate.js';
import { SessionNotLiveException } from '../exceptions/session-not-live.exception.js';
import { NotSessionGmException } from '../exceptions/not-session-gm.exception.js';
import { ActionNotFoundException } from '../exceptions/action-not-found.exception.js';
import type { ActionPipelineRepository } from '../action-pipeline.repository.js';
import type { SessionLivenessChecker } from '../session-liveness-checker.port.js';
import type { Clock } from '../../../shared/clock.js';

describe('ValidateActionHandler', () => {
  let handler: ValidateActionHandler;
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
  const actionId = '770e8400-e29b-41d4-a716-446655440002';

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

    handler = new ValidateActionHandler(
      mockRepository as unknown as ActionPipelineRepository,
      mockClock,
      mockSessionLivenessChecker as unknown as SessionLivenessChecker,
    );
  });

  function aggregateWithPendingAction(): ActionPipelineAggregate {
    return ActionPipelineAggregate.loadFromHistory(sessionId, [
      {
        type: 'ActionProposed',
        data: {
          actionId,
          sessionId,
          campaignId,
          playerId: 'user_player_456',
          actionType: 'move',
          description: 'I move north',
          target: null,
          proposedAt: '2026-03-18T10:00:00.000Z',
        },
      },
    ]);
  }

  it('should validate action and save aggregate', async () => {
    mockRepository.loadOrCreate.mockResolvedValue(aggregateWithPendingAction());

    const command = new ValidateActionCommand(actionId, sessionId, campaignId, gmUserId, 'Well done');
    await handler.execute(command);

    expect(mockSessionLivenessChecker.getLiveSession).toHaveBeenCalledWith(sessionId, campaignId);
    expect(mockRepository.loadOrCreate).toHaveBeenCalledWith(sessionId, campaignId);
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
  });

  it('should validate action without narrative note', async () => {
    mockRepository.loadOrCreate.mockResolvedValue(aggregateWithPendingAction());

    const command = new ValidateActionCommand(actionId, sessionId, campaignId, gmUserId, null);
    await handler.execute(command);

    expect(mockRepository.save).toHaveBeenCalledTimes(1);
  });

  it('should throw SessionNotLiveException when session is not live', async () => {
    mockSessionLivenessChecker.getLiveSession.mockResolvedValue(null);

    const command = new ValidateActionCommand(actionId, sessionId, campaignId, gmUserId, null);
    await expect(handler.execute(command)).rejects.toThrow(SessionNotLiveException);
    expect(mockRepository.loadOrCreate).not.toHaveBeenCalled();
  });

  it('should throw NotSessionGmException when caller is not GM', async () => {
    mockRepository.loadOrCreate.mockResolvedValue(aggregateWithPendingAction());

    const command = new ValidateActionCommand(actionId, sessionId, campaignId, 'other-user', null);
    await expect(handler.execute(command)).rejects.toThrow(NotSessionGmException);
    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('should throw ActionNotFoundException for non-existent action', async () => {
    const emptyAggregate = ActionPipelineAggregate.create(sessionId, campaignId);
    mockRepository.loadOrCreate.mockResolvedValue(emptyAggregate);

    const command = new ValidateActionCommand('non-existent', sessionId, campaignId, gmUserId, null);
    await expect(handler.execute(command)).rejects.toThrow(ActionNotFoundException);
  });
});
