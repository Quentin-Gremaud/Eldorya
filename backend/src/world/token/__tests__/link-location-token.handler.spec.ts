import { LinkLocationTokenHandler } from '../commands/link-location-token.handler.js';
import { LinkLocationTokenCommand } from '../commands/link-location-token.command.js';
import { TokenAggregate } from '../token.aggregate.js';
import { TokenNotFoundException } from '../exceptions/token-not-found.exception.js';
import { NotALocationTokenException } from '../exceptions/not-a-location-token.exception.js';
import type { TokenRepository } from '../token.repository.js';
import type { Clock } from '../../../shared/clock.js';

describe('LinkLocationTokenHandler', () => {
  let handler: LinkLocationTokenHandler;
  let mockRepository: { load: jest.Mock; save: jest.Mock; saveNew: jest.Mock };
  let mockClock: Clock;

  const campaignId = '550e8400-e29b-41d4-a716-446655440000';
  const tokenId = '770e8400-e29b-41d4-a716-446655440001';
  const mapLevelId = '660e8400-e29b-41d4-a716-446655440001';
  const destinationMapLevelId = '880e8400-e29b-41d4-a716-446655440001';
  const newDestinationId = '990e8400-e29b-41d4-a716-446655440001';

  beforeEach(() => {
    mockClock = {
      now: jest.fn().mockReturnValue(new Date('2026-03-09T12:00:00.000Z')),
    };

    const existingAggregate = TokenAggregate.loadFromHistory(campaignId, [
      {
        type: 'TokenPlaced',
        data: {
          campaignId,
          mapLevelId,
          tokenId,
          x: 100,
          y: 200,
          tokenType: 'location',
          label: 'Tavern Entrance',
          placedAt: '2026-03-09T10:00:00.000Z',
          destinationMapLevelId,
        },
      },
    ]);

    mockRepository = {
      load: jest.fn().mockResolvedValue(existingAggregate),
      save: jest.fn().mockResolvedValue(undefined),
      saveNew: jest.fn().mockResolvedValue(undefined),
    };

    handler = new LinkLocationTokenHandler(
      mockRepository as unknown as TokenRepository,
      mockClock,
    );
  });

  it('should link a location token to a valid destination', async () => {
    const command = new LinkLocationTokenCommand(
      campaignId, tokenId, newDestinationId,
    );

    await handler.execute(command);

    expect(mockRepository.load).toHaveBeenCalledWith(campaignId);
    expect(mockRepository.save).toHaveBeenCalledTimes(1);

    const [aggregate] = mockRepository.save.mock.calls[0];
    const events = aggregate.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('LocationTokenLinked');
    expect(events[0].destinationMapLevelId).toBe(newDestinationId);
  });

  it('should propagate TokenNotFoundException for non-existent token', async () => {
    const command = new LinkLocationTokenCommand(
      campaignId, '770e8400-e29b-41d4-a716-446655440099', newDestinationId,
    );

    await expect(handler.execute(command)).rejects.toThrow(TokenNotFoundException);
    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('should propagate NotALocationTokenException for non-location token', async () => {
    const playerAggregate = TokenAggregate.loadFromHistory(campaignId, [
      {
        type: 'TokenPlaced',
        data: {
          campaignId,
          mapLevelId,
          tokenId,
          x: 100,
          y: 200,
          tokenType: 'player',
          label: 'Warrior',
          placedAt: '2026-03-09T10:00:00.000Z',
        },
      },
    ]);
    mockRepository.load.mockResolvedValue(playerAggregate);

    const command = new LinkLocationTokenCommand(
      campaignId, tokenId, newDestinationId,
    );

    await expect(handler.execute(command)).rejects.toThrow(NotALocationTokenException);
    expect(mockRepository.save).not.toHaveBeenCalled();
  });
});
