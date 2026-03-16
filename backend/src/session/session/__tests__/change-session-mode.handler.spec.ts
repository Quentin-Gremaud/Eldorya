import { ChangeSessionModeHandler } from '../commands/change-session-mode.handler.js';
import { ChangeSessionModeCommand } from '../commands/change-session-mode.command.js';
import { SessionAggregate } from '../session.aggregate.js';
import { SameModeTransitionException } from '../exceptions/same-mode-transition.exception.js';
import type { SessionRepository } from '../session.repository.js';
import type { Clock } from '../../../shared/clock.js';

describe('ChangeSessionModeHandler', () => {
  let handler: ChangeSessionModeHandler;
  let mockRepository: { saveNew: jest.Mock; save: jest.Mock; load: jest.Mock };
  let mockClock: Clock;

  const sessionId = '550e8400-e29b-41d4-a716-446655440000';
  const campaignId = '660e8400-e29b-41d4-a716-446655440001';
  const gmUserId = 'user_gm_123';

  const fixedDate = new Date('2026-03-14T12:00:00.000Z');

  function createActiveSession(): SessionAggregate {
    return SessionAggregate.loadFromHistory(sessionId, [
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
    ]);
  }

  beforeEach(() => {
    mockClock = {
      now: jest.fn().mockReturnValue(fixedDate),
    };

    mockRepository = {
      saveNew: jest.fn().mockResolvedValue(undefined),
      save: jest.fn().mockResolvedValue(undefined),
      load: jest.fn().mockResolvedValue(createActiveSession()),
    };

    handler = new ChangeSessionModeHandler(
      mockRepository as unknown as SessionRepository,
      mockClock,
    );
  });

  it('should change session mode from preparation to live', async () => {
    const command = new ChangeSessionModeCommand(sessionId, campaignId, gmUserId, 'live');

    await handler.execute(command);

    expect(mockRepository.load).toHaveBeenCalledWith(sessionId);
    expect(mockRepository.save).toHaveBeenCalledTimes(1);

    const [aggregate] = mockRepository.save.mock.calls[0];
    expect(aggregate.getMode()).toBe('live');
    const events = aggregate.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('SessionModeChanged');
    expect(events[0].newMode).toBe('live');
  });

  it('should change session mode from live to preparation', async () => {
    const liveSession = SessionAggregate.loadFromHistory(sessionId, [
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
    ]);
    mockRepository.load.mockResolvedValue(liveSession);

    const command = new ChangeSessionModeCommand(sessionId, campaignId, gmUserId, 'preparation');

    await handler.execute(command);

    const [aggregate] = mockRepository.save.mock.calls[0];
    expect(aggregate.getMode()).toBe('preparation');
  });

  it('should throw SameModeTransitionException when toggling to same mode', async () => {
    const command = new ChangeSessionModeCommand(sessionId, campaignId, gmUserId, 'preparation');

    await expect(handler.execute(command)).rejects.toThrow(SameModeTransitionException);
    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('should use save (not saveNew) for existing aggregate', async () => {
    const command = new ChangeSessionModeCommand(sessionId, campaignId, gmUserId, 'live');

    await handler.execute(command);

    expect(mockRepository.save).toHaveBeenCalledTimes(1);
    expect(mockRepository.saveNew).not.toHaveBeenCalled();
  });
});
