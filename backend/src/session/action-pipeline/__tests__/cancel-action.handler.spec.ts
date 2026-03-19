import { CancelActionHandler } from '../commands/cancel-action.handler.js';
import { CancelActionCommand } from '../commands/cancel-action.command.js';
import { ActionPipelineAggregate } from '../action-pipeline.aggregate.js';
import { SessionNotLiveException } from '../exceptions/session-not-live.exception.js';
import { PlayerNotInCampaignException } from '../exceptions/player-not-in-campaign.exception.js';
import { ActionNotPendingException } from '../exceptions/action-not-pending.exception.js';
import type { ActionPipelineRepository } from '../action-pipeline.repository.js';
import type { SessionLivenessChecker } from '../session-liveness-checker.port.js';
import type { CampaignMembershipChecker } from '../campaign-membership-checker.port.js';
import type { Clock } from '../../../shared/clock.js';

describe('CancelActionHandler', () => {
  let handler: CancelActionHandler;
  let mockRepository: {
    saveNew: jest.Mock;
    save: jest.Mock;
    load: jest.Mock;
    loadOrCreate: jest.Mock;
  };
  let mockClock: Clock;
  let mockSessionLivenessChecker: { getLiveSession: jest.Mock };
  let mockCampaignMembershipChecker: { isMember: jest.Mock };

  const sessionId = '550e8400-e29b-41d4-a716-446655440000';
  const campaignId = '660e8400-e29b-41d4-a716-446655440001';
  const gmUserId = 'user_gm_123';
  const playerId = 'user_player_456';
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

    mockCampaignMembershipChecker = {
      isMember: jest.fn().mockResolvedValue(true),
    };

    handler = new CancelActionHandler(
      mockRepository as unknown as ActionPipelineRepository,
      mockClock,
      mockSessionLivenessChecker as unknown as SessionLivenessChecker,
      mockCampaignMembershipChecker as unknown as CampaignMembershipChecker,
    );
  });

  it('should cancel a pending action and save', async () => {
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
    mockRepository.load.mockResolvedValue(aggregate);

    const command = new CancelActionCommand(actionId, sessionId, campaignId, playerId);
    await handler.execute(command);

    expect(mockSessionLivenessChecker.getLiveSession).toHaveBeenCalledWith(sessionId, campaignId);
    expect(mockCampaignMembershipChecker.isMember).toHaveBeenCalledWith(campaignId, playerId);
    expect(mockRepository.load).toHaveBeenCalledWith(sessionId);
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
    const [savedAggregate] = mockRepository.save.mock.calls[0];
    expect(savedAggregate.getPendingActionIds()).not.toContain(actionId);
  });

  it('should throw SessionNotLiveException when session is not live', async () => {
    mockSessionLivenessChecker.getLiveSession.mockResolvedValue(null);

    const command = new CancelActionCommand(actionId, sessionId, campaignId, playerId);
    await expect(handler.execute(command)).rejects.toThrow(SessionNotLiveException);
    expect(mockRepository.load).not.toHaveBeenCalled();
  });

  it('should throw PlayerNotInCampaignException when player is not a member', async () => {
    mockCampaignMembershipChecker.isMember.mockResolvedValue(false);

    const command = new CancelActionCommand(actionId, sessionId, campaignId, playerId);
    await expect(handler.execute(command)).rejects.toThrow(PlayerNotInCampaignException);
    expect(mockRepository.load).not.toHaveBeenCalled();
  });

  it('should propagate error when action is not pending', async () => {
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
    ]);
    mockRepository.load.mockResolvedValue(aggregate);

    const command = new CancelActionCommand(actionId, sessionId, campaignId, playerId);
    await expect(handler.execute(command)).rejects.toThrow(ActionNotPendingException);
    expect(mockRepository.save).not.toHaveBeenCalled();
  });
});
