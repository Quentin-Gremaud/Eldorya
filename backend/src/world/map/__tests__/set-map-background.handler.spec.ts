import { SetMapBackgroundHandler } from '../commands/set-map-background.handler.js';
import { SetMapBackgroundCommand } from '../commands/set-map-background.command.js';
import { MapAggregate } from '../map.aggregate.js';
import { MapLevelNotFoundException } from '../exceptions/map-level-not-found.exception.js';
import type { MapRepository } from '../map.repository.js';
import type { Clock } from '../../../shared/clock.js';

describe('SetMapBackgroundHandler', () => {
  let handler: SetMapBackgroundHandler;
  let mockRepository: { load: jest.Mock; save: jest.Mock; saveNew: jest.Mock };
  let mockClock: Clock;

  const campaignId = '550e8400-e29b-41d4-a716-446655440000';
  const mapLevelId = '660e8400-e29b-41d4-a716-446655440001';
  const backgroundImageUrl = 'https://cdn.example.com/campaigns/camp/maps/level/background/img.jpg';

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

    handler = new SetMapBackgroundHandler(
      mockRepository as unknown as MapRepository,
      mockClock,
    );
  });

  it('should load aggregate, set background, and save', async () => {
    const command = new SetMapBackgroundCommand(
      campaignId,
      mapLevelId,
      backgroundImageUrl,
    );

    await handler.execute(command);

    expect(mockRepository.load).toHaveBeenCalledWith(campaignId);
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
  });

  it('should emit MapLevelBackgroundSet event with correct data', async () => {
    const command = new SetMapBackgroundCommand(
      campaignId,
      mapLevelId,
      backgroundImageUrl,
    );

    await handler.execute(command);

    const [aggregate] = mockRepository.save.mock.calls[0];
    const events = aggregate.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('MapLevelBackgroundSet');
    expect(events[0].campaignId).toBe(campaignId);
    expect(events[0].mapLevelId).toBe(mapLevelId);
    expect(events[0].backgroundImageUrl).toBe(backgroundImageUrl);
    expect(events[0].previousBackgroundImageUrl).toBeNull();
  });

  it('should propagate MapLevelNotFoundException for non-existent level', async () => {
    mockRepository.load.mockResolvedValue(MapAggregate.createNew(campaignId));

    const command = new SetMapBackgroundCommand(
      campaignId,
      mapLevelId,
      backgroundImageUrl,
    );

    await expect(handler.execute(command)).rejects.toThrow(
      MapLevelNotFoundException,
    );

    expect(mockRepository.save).not.toHaveBeenCalled();
  });
});
