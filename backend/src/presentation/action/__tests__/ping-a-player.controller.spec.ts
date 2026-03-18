import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { PingAPlayerController } from '../controllers/ping-a-player.controller.js';
import { PingPlayerCommand } from '../../../session/action-pipeline/commands/ping-player.command.js';

describe('PingAPlayerController', () => {
  let controller: PingAPlayerController;
  let commandBus: jest.Mocked<CommandBus>;

  const campaignId = '550e8400-e29b-41d4-a716-446655440000';
  const sessionId = '660e8400-e29b-41d4-a716-446655440001';
  const userId = 'user_gm_123';
  const playerId = '770e8400-e29b-41d4-a716-446655440002';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PingAPlayerController],
      providers: [
        {
          provide: CommandBus,
          useValue: { execute: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    controller = module.get(PingAPlayerController);
    commandBus = module.get(CommandBus);
  });

  it('should dispatch PingPlayerCommand and return 202', async () => {
    const result = await controller.handle(campaignId, sessionId, { playerId }, userId);

    expect(result).toBeUndefined();
    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    const command = commandBus.execute.mock.calls[0][0];
    expect(command).toBeInstanceOf(PingPlayerCommand);
    expect(command.sessionId).toBe(sessionId);
    expect(command.campaignId).toBe(campaignId);
    expect(command.callerUserId).toBe(userId);
    expect(command.playerId).toBe(playerId);
  });
});
