import { HideFogZoneHandler } from '../commands/hide-fog-zone.handler.js';
import { HideFogZoneCommand } from '../commands/hide-fog-zone.command.js';
import { FogStateAggregate } from '../fog-state.aggregate.js';
import { FogZone } from '../fog-zone.js';
import { FogZoneNotFoundException } from '../exceptions/fog-zone-not-found.exception.js';
import type { FogStateRepository } from '../fog-state.repository.js';
import type { Clock } from '../../../shared/clock.js';

describe('HideFogZoneHandler', () => {
  let handler: HideFogZoneHandler;
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
    const zone = FogZone.create(fogZoneId, mapLevelId, 10, 20, 100, 200);
    existingAggregate.revealZone(zone, mockClock);
    existingAggregate.clearEvents();

    mockRepository = {
      load: jest.fn().mockResolvedValue(existingAggregate),
      save: jest.fn().mockResolvedValue(undefined),
      saveNew: jest.fn().mockResolvedValue(undefined),
    };

    handler = new HideFogZoneHandler(
      mockRepository as unknown as FogStateRepository,
      mockClock,
    );
  });

  it('should load aggregate, hide zone, and save', async () => {
    const command = new HideFogZoneCommand(campaignId, playerId, fogZoneId);

    await handler.execute(command);

    expect(mockRepository.load).toHaveBeenCalledWith(campaignId, playerId);
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
    expect(mockRepository.saveNew).not.toHaveBeenCalled();
  });

  it('should emit FogZoneHidden event with correct data', async () => {
    const command = new HideFogZoneCommand(campaignId, playerId, fogZoneId);

    await handler.execute(command);

    const [aggregate] = mockRepository.save.mock.calls[0];
    const events = aggregate.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('FogZoneHidden');
    expect(events[0].fogZoneId).toBe(fogZoneId);
  });

  it('should propagate FogZoneNotFoundException for non-existent zone', async () => {
    const nonExistentZoneId = '990e8400-e29b-41d4-a716-446655440005';
    const command = new HideFogZoneCommand(campaignId, playerId, nonExistentZoneId);

    await expect(handler.execute(command)).rejects.toThrow(FogZoneNotFoundException);
    expect(mockRepository.save).not.toHaveBeenCalled();
  });
});
