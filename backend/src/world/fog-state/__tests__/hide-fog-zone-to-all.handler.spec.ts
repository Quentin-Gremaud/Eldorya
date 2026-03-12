import { HideFogZoneToAllHandler } from '../commands/hide-fog-zone-to-all.handler.js';
import { HideFogZoneToAllCommand } from '../commands/hide-fog-zone-to-all.command.js';
import { FogStateAggregate } from '../fog-state.aggregate.js';
import { FogZone } from '../fog-zone.js';
import type { FogStateRepository } from '../fog-state.repository.js';
import type { CampaignPlayerProvider } from '../campaign-player.provider.js';
import type { Clock } from '../../../shared/clock.js';

describe('HideFogZoneToAllHandler', () => {
  let handler: HideFogZoneToAllHandler;
  let mockRepository: { load: jest.Mock; save: jest.Mock; saveNew: jest.Mock };
  let mockClock: Clock;
  let mockCampaignPlayerProvider: { getPlayerIdsForCampaign: jest.Mock };

  const campaignId = '550e8400-e29b-41d4-a716-446655440000';
  const player1Id = '660e8400-e29b-41d4-a716-446655440001';
  const player2Id = '660e8400-e29b-41d4-a716-446655440002';
  const player3Id = '660e8400-e29b-41d4-a716-446655440003';
  const fogZoneId = '770e8400-e29b-41d4-a716-446655440004';
  const mapLevelId = '880e8400-e29b-41d4-a716-446655440005';

  function createInitializedAggregateWithZone(playerId: string): FogStateAggregate {
    const aggregate = FogStateAggregate.initialize(campaignId, playerId, mockClock);
    const zone = FogZone.create(fogZoneId, mapLevelId, 10, 20, 100, 200);
    aggregate.revealZone(zone, mockClock);
    aggregate.clearEvents();
    return aggregate;
  }

  function createInitializedAggregate(playerId: string): FogStateAggregate {
    const aggregate = FogStateAggregate.initialize(campaignId, playerId, mockClock);
    aggregate.clearEvents();
    return aggregate;
  }

  beforeEach(() => {
    mockClock = {
      now: jest.fn().mockReturnValue(new Date('2026-03-12T12:00:00.000Z')),
    };

    mockRepository = {
      load: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
      saveNew: jest.fn().mockResolvedValue(undefined),
    };

    mockCampaignPlayerProvider = {
      getPlayerIdsForCampaign: jest.fn().mockResolvedValue([player1Id, player2Id, player3Id]),
    };

    // Default: all players have the zone revealed
    mockRepository.load.mockImplementation((_cId: string, playerId: string) =>
      Promise.resolve(createInitializedAggregateWithZone(playerId)),
    );

    handler = new HideFogZoneToAllHandler(
      mockRepository as unknown as FogStateRepository,
      mockClock,
      mockCampaignPlayerProvider as unknown as CampaignPlayerProvider,
    );
  });

  it('should load FogState for each player and call hideZone', async () => {
    const command = new HideFogZoneToAllCommand(campaignId, fogZoneId);

    await handler.execute(command);

    expect(mockCampaignPlayerProvider.getPlayerIdsForCampaign).toHaveBeenCalledWith(campaignId);
    expect(mockRepository.load).toHaveBeenCalledTimes(3);
    expect(mockRepository.load).toHaveBeenCalledWith(campaignId, player1Id);
    expect(mockRepository.load).toHaveBeenCalledWith(campaignId, player2Id);
    expect(mockRepository.load).toHaveBeenCalledWith(campaignId, player3Id);
  });

  it('should save 3 times for 3 players with FogZoneHidden events', async () => {
    const command = new HideFogZoneToAllCommand(campaignId, fogZoneId);

    await handler.execute(command);

    expect(mockRepository.save).toHaveBeenCalledTimes(3);

    for (const [aggregate] of mockRepository.save.mock.calls) {
      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('FogZoneHidden');
      expect(events[0].fogZoneId).toBe(fogZoneId);
    }
  });

  it('should skip player where zone is not revealed gracefully', async () => {
    // Player 2 does NOT have the zone revealed
    mockRepository.load.mockImplementation((_cId: string, playerId: string) => {
      if (playerId === player2Id) {
        return Promise.resolve(createInitializedAggregate(playerId));
      }
      return Promise.resolve(createInitializedAggregateWithZone(playerId));
    });

    const command = new HideFogZoneToAllCommand(campaignId, fogZoneId);

    await expect(handler.execute(command)).resolves.not.toThrow();

    // Should save only for player1 and player3 (player2 skipped)
    expect(mockRepository.save).toHaveBeenCalledTimes(2);
  });

  it('should succeed with 0 hides for empty campaign', async () => {
    mockCampaignPlayerProvider.getPlayerIdsForCampaign.mockResolvedValue([]);

    const command = new HideFogZoneToAllCommand(campaignId, fogZoneId);

    await expect(handler.execute(command)).resolves.not.toThrow();

    expect(mockRepository.load).not.toHaveBeenCalled();
    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('should re-throw non-FogZoneNotFoundException errors', async () => {
    const repositoryError = new Error('EventStore connection failed');
    mockRepository.save.mockRejectedValueOnce(repositoryError);

    const command = new HideFogZoneToAllCommand(campaignId, fogZoneId);

    await expect(handler.execute(command)).rejects.toThrow('EventStore connection failed');
  });
});
