import { MoveTokenHandler } from '../commands/move-token.handler.js';
import { MoveTokenCommand } from '../commands/move-token.command.js';
import { TokenAggregate } from '../token.aggregate.js';
import { TokenNotFoundException } from '../exceptions/token-not-found.exception.js';
import type { TokenRepository } from '../token.repository.js';
import type { Clock } from '../../../shared/clock.js';

describe('MoveTokenHandler', () => {
  let handler: MoveTokenHandler;
  let mockRepository: { load: jest.Mock; save: jest.Mock };
  let mockClock: Clock;

  const campaignId = '550e8400-e29b-41d4-a716-446655440000';
  const tokenId = '770e8400-e29b-41d4-a716-446655440001';
  const mapLevelId = '660e8400-e29b-41d4-a716-446655440001';

  beforeEach(() => {
    mockClock = {
      now: jest.fn().mockReturnValue(new Date('2026-03-09T12:00:00.000Z')),
    };

    const existingAggregate = TokenAggregate.createNew(campaignId);
    existingAggregate.placeToken(tokenId, mapLevelId, 100, 200, 'player', 'Warrior', mockClock);
    existingAggregate.clearEvents();

    mockRepository = {
      load: jest.fn().mockResolvedValue(existingAggregate),
      save: jest.fn().mockResolvedValue(undefined),
    };

    handler = new MoveTokenHandler(
      mockRepository as unknown as TokenRepository,
      mockClock,
    );
  });

  it('should load aggregate, move token, and save', async () => {
    const command = new MoveTokenCommand(campaignId, tokenId, 300, 400);

    await handler.execute(command);

    expect(mockRepository.load).toHaveBeenCalledWith(campaignId);
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
  });

  it('should emit TokenMoved event with correct data', async () => {
    const command = new MoveTokenCommand(campaignId, tokenId, 300, 400);

    await handler.execute(command);

    const [aggregate] = mockRepository.save.mock.calls[0];
    const events = aggregate.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('TokenMoved');
    expect(events[0].tokenId).toBe(tokenId);
    expect(events[0].x).toBe(300);
    expect(events[0].y).toBe(400);
  });

  it('should propagate TokenNotFoundException', async () => {
    mockRepository.load.mockResolvedValue(TokenAggregate.createNew(campaignId));

    const command = new MoveTokenCommand(campaignId, tokenId, 300, 400);

    await expect(handler.execute(command)).rejects.toThrow(TokenNotFoundException);
    expect(mockRepository.save).not.toHaveBeenCalled();
  });
});
