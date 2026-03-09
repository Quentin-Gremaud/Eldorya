import { CreateMapLevelHandler } from '../commands/create-map-level.handler.js';
import { CreateMapLevelCommand } from '../commands/create-map-level.command.js';
import { MapAggregate } from '../map.aggregate.js';
import { ParentMapLevelNotFoundException } from '../exceptions/parent-map-level-not-found.exception.js';
import type { MapRepository } from '../map.repository.js';
import type { Clock } from '../../../shared/clock.js';

describe('CreateMapLevelHandler', () => {
  let handler: CreateMapLevelHandler;
  let mockRepository: { load: jest.Mock; save: jest.Mock; saveNew: jest.Mock };
  let mockClock: Clock;

  const campaignId = '550e8400-e29b-41d4-a716-446655440000';
  const mapLevelId = '660e8400-e29b-41d4-a716-446655440001';

  beforeEach(() => {
    mockClock = {
      now: jest.fn().mockReturnValue(new Date('2026-03-08T12:00:00.000Z')),
    };

    mockRepository = {
      load: jest
        .fn()
        .mockResolvedValue(MapAggregate.createNew(campaignId)),
      save: jest.fn().mockResolvedValue(undefined),
      saveNew: jest.fn().mockResolvedValue(undefined),
    };

    handler = new CreateMapLevelHandler(
      mockRepository as unknown as MapRepository,
      mockClock,
    );
  });

  it('should load aggregate, create level, and save', async () => {
    const command = new CreateMapLevelCommand(
      campaignId,
      mapLevelId,
      'World',
      null,
    );

    await handler.execute(command);

    expect(mockRepository.load).toHaveBeenCalledWith(campaignId);
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
  });

  it('should emit MapLevelCreated event with correct data', async () => {
    const command = new CreateMapLevelCommand(
      campaignId,
      mapLevelId,
      'World',
      null,
    );

    await handler.execute(command);

    const [aggregate] = mockRepository.save.mock.calls[0];
    const events = aggregate.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('MapLevelCreated');
    expect(events[0].campaignId).toBe(campaignId);
    expect(events[0].mapLevelId).toBe(mapLevelId);
    expect(events[0].name).toBe('World');
    expect(events[0].parentId).toBeNull();
    expect(events[0].depth).toBe(0);
  });

  it('should create child level under existing parent', async () => {
    const parentId = '770e8400-e29b-41d4-a716-446655440000';
    const existingMap = MapAggregate.createNew(campaignId);
    existingMap.createLevel(parentId, 'World', null, mockClock);
    existingMap.clearEvents();

    mockRepository.load.mockResolvedValue(existingMap);

    const command = new CreateMapLevelCommand(
      campaignId,
      mapLevelId,
      'Continent',
      parentId,
    );

    await handler.execute(command);

    const [aggregate] = mockRepository.save.mock.calls[0];
    const events = aggregate.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0].parentId).toBe(parentId);
    expect(events[0].depth).toBe(1);
  });

  it('should propagate ParentMapLevelNotFoundException', async () => {
    const nonExistentParent = '770e8400-e29b-41d4-a716-446655440000';

    const command = new CreateMapLevelCommand(
      campaignId,
      mapLevelId,
      'City',
      nonExistentParent,
    );

    await expect(handler.execute(command)).rejects.toThrow(
      ParentMapLevelNotFoundException,
    );

    expect(mockRepository.save).not.toHaveBeenCalled();
  });
});
