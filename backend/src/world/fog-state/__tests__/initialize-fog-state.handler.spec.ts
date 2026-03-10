import { InitializeFogStateHandler } from '../commands/initialize-fog-state.handler.js';
import { InitializeFogStateCommand } from '../commands/initialize-fog-state.command.js';
import type { FogStateRepository } from '../fog-state.repository.js';
import type { Clock } from '../../../shared/clock.js';

describe('InitializeFogStateHandler', () => {
  let handler: InitializeFogStateHandler;
  let mockRepository: { load: jest.Mock; save: jest.Mock; saveNew: jest.Mock };
  let mockClock: Clock;

  const campaignId = '550e8400-e29b-41d4-a716-446655440000';
  const playerId = '660e8400-e29b-41d4-a716-446655440001';

  beforeEach(() => {
    mockClock = {
      now: jest.fn().mockReturnValue(new Date('2026-03-10T12:00:00.000Z')),
    };

    mockRepository = {
      load: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
      saveNew: jest.fn().mockResolvedValue(undefined),
    };

    handler = new InitializeFogStateHandler(
      mockRepository as unknown as FogStateRepository,
      mockClock,
    );
  });

  it('should create new aggregate and call saveNew', async () => {
    const command = new InitializeFogStateCommand(campaignId, playerId);

    await handler.execute(command);

    expect(mockRepository.saveNew).toHaveBeenCalledTimes(1);
    expect(mockRepository.save).not.toHaveBeenCalled();
    expect(mockRepository.load).not.toHaveBeenCalled();
  });

  it('should emit FogStateInitialized event with correct data', async () => {
    const command = new InitializeFogStateCommand(campaignId, playerId);

    await handler.execute(command);

    const [aggregate] = mockRepository.saveNew.mock.calls[0];
    const events = aggregate.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('FogStateInitialized');
    expect(events[0].campaignId).toBe(campaignId);
    expect(events[0].playerId).toBe(playerId);
  });

  it('should propagate validation errors for invalid ids', async () => {
    const command = new InitializeFogStateCommand('bad-id', playerId);

    await expect(handler.execute(command)).rejects.toThrow();
    expect(mockRepository.saveNew).not.toHaveBeenCalled();
  });
});
