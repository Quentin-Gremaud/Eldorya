import { TogglePipelineModeHandler } from '../commands/toggle-pipeline-mode.handler.js';
import { TogglePipelineModeCommand } from '../commands/toggle-pipeline-mode.command.js';
import { SessionAggregate } from '../session.aggregate.js';
import { SamePipelineModeException } from '../exceptions/same-pipeline-mode.exception.js';
import { NotSessionGmException } from '../exceptions/not-session-gm.exception.js';
import type { SessionRepository } from '../session.repository.js';
import type { Clock } from '../../../shared/clock.js';

describe('TogglePipelineModeHandler', () => {
  let handler: TogglePipelineModeHandler;
  let mockRepository: {
    saveNew: jest.Mock;
    save: jest.Mock;
    load: jest.Mock;
  };
  let mockClock: Clock;

  const sessionId = '550e8400-e29b-41d4-a716-446655440000';
  const campaignId = '660e8400-e29b-41d4-a716-446655440001';
  const gmUserId = 'user_gm_123';

  beforeEach(() => {
    mockClock = {
      now: jest.fn().mockReturnValue(new Date('2026-03-18T12:00:00.000Z')),
    };

    mockRepository = {
      saveNew: jest.fn().mockResolvedValue(undefined),
      save: jest.fn().mockResolvedValue(undefined),
      load: jest.fn(),
    };

    handler = new TogglePipelineModeHandler(
      mockRepository as unknown as SessionRepository,
      mockClock,
    );
  });

  it('should toggle pipeline mode and save', async () => {
    const aggregate = SessionAggregate.loadFromHistory(sessionId, [
      {
        type: 'SessionStarted',
        data: {
          sessionId,
          campaignId,
          gmUserId,
          mode: 'preparation',
          startedAt: '2026-03-18T10:00:00.000Z',
        },
      },
    ]);
    mockRepository.load.mockResolvedValue(aggregate);

    const command = new TogglePipelineModeCommand(sessionId, campaignId, gmUserId, 'mandatory');
    await handler.execute(command);

    expect(mockRepository.load).toHaveBeenCalledWith(sessionId);
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
    const [savedAggregate] = mockRepository.save.mock.calls[0];
    expect(savedAggregate.getPipelineMode()).toBe('mandatory');
  });

  it('should propagate error when toggling to same mode', async () => {
    const aggregate = SessionAggregate.loadFromHistory(sessionId, [
      {
        type: 'SessionStarted',
        data: {
          sessionId,
          campaignId,
          gmUserId,
          mode: 'preparation',
          startedAt: '2026-03-18T10:00:00.000Z',
        },
      },
    ]);
    mockRepository.load.mockResolvedValue(aggregate);

    const command = new TogglePipelineModeCommand(sessionId, campaignId, gmUserId, 'optional');
    await expect(handler.execute(command)).rejects.toThrow(SamePipelineModeException);
    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('should propagate error for invalid mode', async () => {
    const aggregate = SessionAggregate.loadFromHistory(sessionId, [
      {
        type: 'SessionStarted',
        data: {
          sessionId,
          campaignId,
          gmUserId,
          mode: 'preparation',
          startedAt: '2026-03-18T10:00:00.000Z',
        },
      },
    ]);
    mockRepository.load.mockResolvedValue(aggregate);

    const command = new TogglePipelineModeCommand(sessionId, campaignId, gmUserId, 'invalid');
    await expect(handler.execute(command)).rejects.toThrow("Invalid PipelineMode: 'invalid'");
    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('should throw NotSessionGmException when caller is not the GM', async () => {
    const aggregate = SessionAggregate.loadFromHistory(sessionId, [
      {
        type: 'SessionStarted',
        data: {
          sessionId,
          campaignId,
          gmUserId,
          mode: 'preparation',
          startedAt: '2026-03-18T10:00:00.000Z',
        },
      },
    ]);
    mockRepository.load.mockResolvedValue(aggregate);

    const nonGmUserId = 'user_not_gm_456';
    const command = new TogglePipelineModeCommand(sessionId, campaignId, nonGmUserId, 'mandatory');
    await expect(handler.execute(command)).rejects.toThrow(NotSessionGmException);
    expect(mockRepository.save).not.toHaveBeenCalled();
  });
});
