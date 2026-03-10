import { PlaceTokenHandler } from '../commands/place-token.handler.js';
import { PlaceTokenCommand } from '../commands/place-token.command.js';
import { TokenAggregate } from '../token.aggregate.js';
import { TokenAlreadyExistsException } from '../exceptions/token-already-exists.exception.js';
import type { TokenRepository } from '../token.repository.js';
import type { Clock } from '../../../shared/clock.js';

describe('PlaceTokenHandler', () => {
  let handler: PlaceTokenHandler;
  let mockRepository: { load: jest.Mock; save: jest.Mock; saveNew: jest.Mock };
  let mockClock: Clock;

  const campaignId = '550e8400-e29b-41d4-a716-446655440000';
  const tokenId = '770e8400-e29b-41d4-a716-446655440001';
  const mapLevelId = '660e8400-e29b-41d4-a716-446655440001';

  beforeEach(() => {
    mockClock = {
      now: jest.fn().mockReturnValue(new Date('2026-03-09T12:00:00.000Z')),
    };

    mockRepository = {
      load: jest.fn().mockResolvedValue(TokenAggregate.createNew(campaignId)),
      save: jest.fn().mockResolvedValue(undefined),
      saveNew: jest.fn().mockResolvedValue(undefined),
    };

    handler = new PlaceTokenHandler(
      mockRepository as unknown as TokenRepository,
      mockClock,
    );
  });

  it('should use saveNew when aggregate is new (first token)', async () => {
    const command = new PlaceTokenCommand(
      campaignId, tokenId, mapLevelId, 100, 200, 'player', 'Warrior',
    );

    await handler.execute(command);

    expect(mockRepository.load).toHaveBeenCalledWith(campaignId);
    expect(mockRepository.saveNew).toHaveBeenCalledTimes(1);
    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('should emit TokenPlaced event with correct data', async () => {
    const command = new PlaceTokenCommand(
      campaignId, tokenId, mapLevelId, 100, 200, 'npc', 'Guard',
    );

    await handler.execute(command);

    const [aggregate] = mockRepository.saveNew.mock.calls[0];
    const events = aggregate.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('TokenPlaced');
    expect(events[0].campaignId).toBe(campaignId);
    expect(events[0].tokenId).toBe(tokenId);
    expect(events[0].mapLevelId).toBe(mapLevelId);
    expect(events[0].x).toBe(100);
    expect(events[0].y).toBe(200);
    expect(events[0].tokenType).toBe('npc');
    expect(events[0].label).toBe('Guard');
  });

  it('should use save (not saveNew) when aggregate has existing tokens', async () => {
    const existingAggregate = TokenAggregate.loadFromHistory(campaignId, [
      {
        type: 'TokenPlaced',
        data: {
          campaignId,
          mapLevelId,
          tokenId: '880e8400-e29b-41d4-a716-446655440000',
          x: 50,
          y: 50,
          tokenType: 'player',
          label: 'Existing',
          placedAt: '2026-03-09T12:00:00.000Z',
        },
      },
    ]);
    mockRepository.load.mockResolvedValue(existingAggregate);

    const command = new PlaceTokenCommand(
      campaignId, tokenId, mapLevelId, 100, 200, 'npc', 'Guard',
    );

    await handler.execute(command);

    expect(mockRepository.save).toHaveBeenCalledTimes(1);
    expect(mockRepository.saveNew).not.toHaveBeenCalled();
  });

  it('should propagate TokenAlreadyExistsException', async () => {
    const existingAggregate = TokenAggregate.createNew(campaignId);
    existingAggregate.placeToken(tokenId, mapLevelId, 50, 50, 'player', 'Existing', mockClock);
    existingAggregate.clearEvents();
    mockRepository.load.mockResolvedValue(existingAggregate);

    const command = new PlaceTokenCommand(
      campaignId, tokenId, mapLevelId, 100, 200, 'npc', 'Duplicate',
    );

    await expect(handler.execute(command)).rejects.toThrow(TokenAlreadyExistsException);
    expect(mockRepository.save).not.toHaveBeenCalled();
  });
});
