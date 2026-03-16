import { StartSessionHandler } from '../commands/start-session.handler.js';
import { StartSessionCommand } from '../commands/start-session.command.js';
import type { SessionRepository } from '../session.repository.js';
import type { Clock } from '../../../shared/clock.js';

describe('StartSessionHandler', () => {
  let handler: StartSessionHandler;
  let mockRepository: { saveNew: jest.Mock; save: jest.Mock; load: jest.Mock };
  let mockClock: Clock;

  const sessionId = '550e8400-e29b-41d4-a716-446655440000';
  const campaignId = '660e8400-e29b-41d4-a716-446655440001';
  const gmUserId = 'user_gm_123';

  beforeEach(() => {
    mockClock = {
      now: jest.fn().mockReturnValue(new Date('2026-03-14T12:00:00.000Z')),
    };

    mockRepository = {
      saveNew: jest.fn().mockResolvedValue(undefined),
      save: jest.fn().mockResolvedValue(undefined),
      load: jest.fn(),
    };

    handler = new StartSessionHandler(
      mockRepository as unknown as SessionRepository,
      mockClock,
    );
  });

  it('should create a new session aggregate and persist it', async () => {
    const command = new StartSessionCommand(sessionId, campaignId, gmUserId);

    await handler.execute(command);

    expect(mockRepository.saveNew).toHaveBeenCalledTimes(1);
    const [aggregate] = mockRepository.saveNew.mock.calls[0];
    expect(aggregate.getSessionId()).toBe(sessionId);
    expect(aggregate.getCampaignId()).toBe(campaignId);
    expect(aggregate.getGmUserId()).toBe(gmUserId);
    expect(aggregate.getMode()).toBe('preparation');
    expect(aggregate.getStatus()).toBe('active');
  });

  it('should emit SessionStarted event with correct data', async () => {
    const command = new StartSessionCommand(sessionId, campaignId, gmUserId);

    await handler.execute(command);

    const [aggregate] = mockRepository.saveNew.mock.calls[0];
    const events = aggregate.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('SessionStarted');
    expect(events[0].sessionId).toBe(sessionId);
    expect(events[0].campaignId).toBe(campaignId);
    expect(events[0].gmUserId).toBe(gmUserId);
    expect(events[0].mode).toBe('preparation');
  });

  it('should always use saveNew (session is always new)', async () => {
    const command = new StartSessionCommand(sessionId, campaignId, gmUserId);

    await handler.execute(command);

    expect(mockRepository.saveNew).toHaveBeenCalledTimes(1);
    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('should propagate validation errors from aggregate', async () => {
    const command = new StartSessionCommand('', campaignId, gmUserId);

    await expect(handler.execute(command)).rejects.toThrow('SessionId cannot be empty');
    expect(mockRepository.saveNew).not.toHaveBeenCalled();
  });
});
