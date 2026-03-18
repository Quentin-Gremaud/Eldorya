import { PingPlayerHandler } from '../commands/ping-player.handler.js';
import { PingPlayerCommand } from '../commands/ping-player.command.js';
import { ActionPipelineAggregate } from '../action-pipeline.aggregate.js';
import { SessionNotLiveException } from '../exceptions/session-not-live.exception.js';
import { NotSessionGmException } from '../exceptions/not-session-gm.exception.js';
import type { ActionPipelineRepository } from '../action-pipeline.repository.js';
import type { SessionLivenessChecker } from '../session-liveness-checker.port.js';
import type { Clock } from '../../../shared/clock.js';

describe('PingPlayerHandler', () => {
  let handler: PingPlayerHandler;
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

    handler = new PingPlayerHandler(
      mockRepository as unknown as ActionPipelineRepository,
      mockClock,
      mockSessionLivenessChecker as unknown as SessionLivenessChecker,
    );
  });

  it('should ping player and save new aggregate when stream does not exist', async () => {
    const newAggregate = ActionPipelineAggregate.create(sessionId, campaignId);
    mockRepository.loadOrCreate.mockResolvedValue(newAggregate);

    const command = new PingPlayerCommand(sessionId, campaignId, gmUserId, playerId);
    await handler.execute(command);

    expect(mockSessionLivenessChecker.getLiveSession).toHaveBeenCalledWith(sessionId, campaignId);
    expect(mockRepository.loadOrCreate).toHaveBeenCalledWith(sessionId, campaignId);
    expect(mockRepository.saveNew).toHaveBeenCalledTimes(1);
    const [aggregate] = mockRepository.saveNew.mock.calls[0];
    expect(aggregate.getPingedPlayerIds()).toContain(playerId);
  });

  it('should ping player and save existing aggregate', async () => {
    const existingAggregate = ActionPipelineAggregate.loadFromHistory(sessionId, [
      {
        type: 'PlayerPinged',
        data: {
          sessionId,
          campaignId,
          playerId: 'other-player',
          gmUserId,
          pingedAt: '2026-03-18T10:00:00.000Z',
        },
      },
    ]);
    mockRepository.loadOrCreate.mockResolvedValue(existingAggregate);

    const command = new PingPlayerCommand(sessionId, campaignId, gmUserId, playerId);
    await handler.execute(command);

    expect(mockRepository.save).toHaveBeenCalledTimes(1);
    expect(mockRepository.saveNew).not.toHaveBeenCalled();
  });

  it('should throw SessionNotLiveException when session is not live', async () => {
    mockSessionLivenessChecker.getLiveSession.mockResolvedValue(null);

    const command = new PingPlayerCommand(sessionId, campaignId, gmUserId, playerId);
    await expect(handler.execute(command)).rejects.toThrow(SessionNotLiveException);
    expect(mockRepository.loadOrCreate).not.toHaveBeenCalled();
  });

  it('should throw NotSessionGmException when caller is not GM', async () => {
    const newAggregate = ActionPipelineAggregate.create(sessionId, campaignId);
    mockRepository.loadOrCreate.mockResolvedValue(newAggregate);

    const command = new PingPlayerCommand(sessionId, campaignId, 'other-user', playerId);
    await expect(handler.execute(command)).rejects.toThrow(NotSessionGmException);
    expect(mockRepository.saveNew).not.toHaveBeenCalled();
  });

  it('should propagate validation errors', async () => {
    const newAggregate = ActionPipelineAggregate.create(sessionId, campaignId);
    mockRepository.loadOrCreate.mockResolvedValue(newAggregate);

    const command = new PingPlayerCommand(sessionId, campaignId, gmUserId, '');
    await expect(handler.execute(command)).rejects.toThrow('Player ID cannot be empty');
    expect(mockRepository.saveNew).not.toHaveBeenCalled();
  });
});
