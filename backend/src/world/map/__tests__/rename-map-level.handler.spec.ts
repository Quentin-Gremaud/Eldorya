import { RenameMapLevelHandler } from '../commands/rename-map-level.handler.js';
import { RenameMapLevelCommand } from '../commands/rename-map-level.command.js';
import { MapAggregate } from '../map.aggregate.js';
import { MapLevelNotFoundException } from '../exceptions/map-level-not-found.exception.js';
import type { MapRepository } from '../map.repository.js';
import type { Clock } from '../../../shared/clock.js';

describe('RenameMapLevelHandler', () => {
  let handler: RenameMapLevelHandler;
  let mockRepository: { load: jest.Mock; save: jest.Mock; saveNew: jest.Mock };
  let mockClock: Clock;

  const campaignId = '550e8400-e29b-41d4-a716-446655440000';
  const mapLevelId = '660e8400-e29b-41d4-a716-446655440001';

  beforeEach(() => {
    mockClock = {
      now: jest.fn().mockReturnValue(new Date('2026-03-08T12:00:00.000Z')),
    };

    const existingMap = MapAggregate.createNew(campaignId);
    existingMap.createLevel(mapLevelId, 'World', null, mockClock);
    existingMap.clearEvents();

    mockRepository = {
      load: jest.fn().mockResolvedValue(existingMap),
      save: jest.fn().mockResolvedValue(undefined),
      saveNew: jest.fn().mockResolvedValue(undefined),
    };

    handler = new RenameMapLevelHandler(
      mockRepository as unknown as MapRepository,
      mockClock,
    );
  });

  it('should load aggregate, rename level, and save', async () => {
    const command = new RenameMapLevelCommand(
      campaignId,
      mapLevelId,
      'New World',
    );

    await handler.execute(command);

    expect(mockRepository.load).toHaveBeenCalledWith(campaignId);
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
  });

  it('should emit MapLevelRenamed event with correct data', async () => {
    const command = new RenameMapLevelCommand(
      campaignId,
      mapLevelId,
      'New World',
    );

    await handler.execute(command);

    const [aggregate] = mockRepository.save.mock.calls[0];
    const events = aggregate.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('MapLevelRenamed');
    expect(events[0].mapLevelId).toBe(mapLevelId);
    expect(events[0].newName).toBe('New World');
  });

  it('should propagate exception when level does not exist', async () => {
    const nonExistentId = '770e8400-e29b-41d4-a716-446655440000';
    const command = new RenameMapLevelCommand(
      campaignId,
      nonExistentId,
      'New Name',
    );

    await expect(handler.execute(command)).rejects.toThrow(
      MapLevelNotFoundException,
    );

    expect(mockRepository.save).not.toHaveBeenCalled();
  });
});
