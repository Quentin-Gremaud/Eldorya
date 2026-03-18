import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { ProposeAnActionController } from '../controllers/propose-an-action.controller.js';
import { ProposeActionCommand } from '../../../session/action-pipeline/commands/propose-action.command.js';

describe('ProposeAnActionController', () => {
  let controller: ProposeAnActionController;
  let commandBus: jest.Mocked<CommandBus>;

  const campaignId = '550e8400-e29b-41d4-a716-446655440000';
  const sessionId = '660e8400-e29b-41d4-a716-446655440001';
  const playerId = 'user_player_456';
  const actionId = '770e8400-e29b-41d4-a716-446655440002';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProposeAnActionController],
      providers: [
        {
          provide: CommandBus,
          useValue: { execute: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    controller = module.get(ProposeAnActionController);
    commandBus = module.get(CommandBus);
  });

  it('should dispatch ProposeActionCommand and return 202', async () => {
    const dto = {
      actionId,
      actionType: 'move',
      description: 'I move north',
      target: undefined,
    };

    const result = await controller.handle(campaignId, sessionId, dto, playerId);

    expect(result).toBeUndefined();
    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    const command = commandBus.execute.mock.calls[0][0];
    expect(command).toBeInstanceOf(ProposeActionCommand);
    expect(command.actionId).toBe(actionId);
    expect(command.sessionId).toBe(sessionId);
    expect(command.campaignId).toBe(campaignId);
    expect(command.playerId).toBe(playerId);
    expect(command.actionType).toBe('move');
    expect(command.description).toBe('I move north');
    expect(command.target).toBeNull();
  });

  it('should pass target when provided', async () => {
    const dto = {
      actionId,
      actionType: 'attack',
      description: 'I attack goblin',
      target: 'token-goblin-1',
    };

    await controller.handle(campaignId, sessionId, dto, playerId);

    const command = commandBus.execute.mock.calls[0][0];
    expect(command.target).toBe('token-goblin-1');
  });
});
