import { ProposeActionHandler } from '../commands/propose-action.handler.js';
import { ProposeActionCommand } from '../commands/propose-action.command.js';
import { ActionPipelineAggregate } from '../action-pipeline.aggregate.js';
import { InvalidActionProposalException } from '../exceptions/invalid-action-proposal.exception.js';
import { SessionNotLiveException } from '../exceptions/session-not-live.exception.js';
import { PlayerNotInCampaignException } from '../exceptions/player-not-in-campaign.exception.js';
import type { ActionPipelineRepository } from '../action-pipeline.repository.js';
import type { SessionLivenessChecker } from '../session-liveness-checker.port.js';
import type { CampaignMembershipChecker } from '../campaign-membership-checker.port.js';
import type { Clock } from '../../../shared/clock.js';

describe('ProposeActionHandler', () => {
  let handler: ProposeActionHandler;
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

    handler = new ProposeActionHandler(
      mockRepository as unknown as ActionPipelineRepository,
      mockClock,
      mockSessionLivenessChecker as unknown as SessionLivenessChecker,
      mockCampaignMembershipChecker as unknown as CampaignMembershipChecker,
    );
  });

  it('should propose action and save new aggregate', async () => {
    const newAggregate = ActionPipelineAggregate.create(sessionId, campaignId);
    mockRepository.loadOrCreate.mockResolvedValue(newAggregate);

    const command = new ProposeActionCommand(
      actionId, sessionId, campaignId, playerId, 'move', 'I move north', null,
    );
    await handler.execute(command);

    expect(mockSessionLivenessChecker.getLiveSession).toHaveBeenCalledWith(sessionId, campaignId);
    expect(mockCampaignMembershipChecker.isMember).toHaveBeenCalledWith(campaignId, playerId);
    expect(mockRepository.loadOrCreate).toHaveBeenCalledWith(sessionId, campaignId);
    expect(mockRepository.saveNew).toHaveBeenCalledTimes(1);
    const [aggregate] = mockRepository.saveNew.mock.calls[0];
    expect(aggregate.getPendingActionIds()).toContain(actionId);
  });

  it('should propose action and save existing aggregate', async () => {
    const existingAggregate = ActionPipelineAggregate.loadFromHistory(sessionId, [
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
    ]);
    mockRepository.loadOrCreate.mockResolvedValue(existingAggregate);

    const command = new ProposeActionCommand(
      actionId, sessionId, campaignId, playerId, 'attack', 'I attack', 'token-1',
    );
    await handler.execute(command);

    expect(mockRepository.save).toHaveBeenCalledTimes(1);
    expect(mockRepository.saveNew).not.toHaveBeenCalled();
  });

  it('should throw SessionNotLiveException when session is not live', async () => {
    mockSessionLivenessChecker.getLiveSession.mockResolvedValue(null);

    const command = new ProposeActionCommand(
      actionId, sessionId, campaignId, playerId, 'move', 'I move', null,
    );
    await expect(handler.execute(command)).rejects.toThrow(SessionNotLiveException);
    expect(mockRepository.loadOrCreate).not.toHaveBeenCalled();
  });

  it('should throw PlayerNotInCampaignException when player is not a member', async () => {
    mockCampaignMembershipChecker.isMember.mockResolvedValue(false);

    const command = new ProposeActionCommand(
      actionId, sessionId, campaignId, playerId, 'move', 'I move', null,
    );
    await expect(handler.execute(command)).rejects.toThrow(PlayerNotInCampaignException);
    expect(mockRepository.loadOrCreate).not.toHaveBeenCalled();
  });

  it('should propagate validation error for empty description', async () => {
    const newAggregate = ActionPipelineAggregate.create(sessionId, campaignId);
    mockRepository.loadOrCreate.mockResolvedValue(newAggregate);

    const command = new ProposeActionCommand(
      actionId, sessionId, campaignId, playerId, 'move', '', null,
    );
    await expect(handler.execute(command)).rejects.toThrow(InvalidActionProposalException);
    expect(mockRepository.saveNew).not.toHaveBeenCalled();
  });

  it('should propagate validation error for invalid action type', async () => {
    const newAggregate = ActionPipelineAggregate.create(sessionId, campaignId);
    mockRepository.loadOrCreate.mockResolvedValue(newAggregate);

    const command = new ProposeActionCommand(
      actionId, sessionId, campaignId, playerId, 'invalid', 'description', null,
    );
    await expect(handler.execute(command)).rejects.toThrow(InvalidActionProposalException);
    expect(mockRepository.saveNew).not.toHaveBeenCalled();
  });
});
