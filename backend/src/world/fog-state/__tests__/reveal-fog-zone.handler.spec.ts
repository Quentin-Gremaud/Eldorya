import { RevealFogZoneHandler } from '../commands/reveal-fog-zone.handler.js';
import { RevealFogZoneCommand } from '../commands/reveal-fog-zone.command.js';
import { FogStateAggregate } from '../fog-state.aggregate.js';
import type { FogStateRepository } from '../fog-state.repository.js';
import type { Clock } from '../../../shared/clock.js';

describe('RevealFogZoneHandler', () => {
  let handler: RevealFogZoneHandler;
  let mockRepository: { load: jest.Mock; save: jest.Mock; saveNew: jest.Mock };
  let mockClock: Clock;

  const campaignId = '550e8400-e29b-41d4-a716-446655440000';
  const playerId = '660e8400-e29b-41d4-a716-446655440001';
  const fogZoneId = '770e8400-e29b-41d4-a716-446655440002';
  const mapLevelId = '880e8400-e29b-41d4-a716-446655440003';

  beforeEach(() => {
    mockClock = {
      now: jest.fn().mockReturnValue(new Date('2026-03-10T12:00:00.000Z')),
    };

    const existingAggregate = FogStateAggregate.initialize(campaignId, playerId, mockClock);
    existingAggregate.clearEvents();

    mockRepository = {
      load: jest.fn().mockResolvedValue(existingAggregate),
      save: jest.fn().mockResolvedValue(undefined),
      saveNew: jest.fn().mockResolvedValue(undefined),
    };

    handler = new RevealFogZoneHandler(
      mockRepository as unknown as FogStateRepository,
      mockClock,
    );
  });

  it('should load aggregate, reveal zone, and save', async () => {
    const command = new RevealFogZoneCommand(
      campaignId, playerId, fogZoneId, mapLevelId, 10, 20, 100, 200,
    );

    await handler.execute(command);

    expect(mockRepository.load).toHaveBeenCalledWith(campaignId, playerId);
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
    expect(mockRepository.saveNew).not.toHaveBeenCalled();
  });

  it('should emit FogZoneRevealed event with correct data', async () => {
    const command = new RevealFogZoneCommand(
      campaignId, playerId, fogZoneId, mapLevelId, 10, 20, 100, 200,
    );

    await handler.execute(command);

    const [aggregate] = mockRepository.save.mock.calls[0];
    const events = aggregate.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('FogZoneRevealed');
    expect(events[0].fogZoneId).toBe(fogZoneId);
    expect(events[0].mapLevelId).toBe(mapLevelId);
    expect(events[0].x).toBe(10);
    expect(events[0].y).toBe(20);
    expect(events[0].width).toBe(100);
    expect(events[0].height).toBe(200);
  });

  it('should follow load-call-save pattern with no business logic', async () => {
    const command = new RevealFogZoneCommand(
      campaignId, playerId, fogZoneId, mapLevelId, 10, 20, 100, 200,
    );

    await handler.execute(command);

    // Verify load is called before save
    const loadOrder = mockRepository.load.mock.invocationCallOrder[0];
    const saveOrder = mockRepository.save.mock.invocationCallOrder[0];
    expect(loadOrder).toBeLessThan(saveOrder);
  });
});
