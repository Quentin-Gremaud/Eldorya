import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { ValidateAnActionController } from '../controllers/validate-an-action.controller.js';
import { ValidateActionCommand } from '../../../session/action-pipeline/commands/validate-action.command.js';

describe('ValidateAnActionController', () => {
  let controller: ValidateAnActionController;
  let commandBus: jest.Mocked<CommandBus>;

  const campaignId = '550e8400-e29b-41d4-a716-446655440000';
  const sessionId = '660e8400-e29b-41d4-a716-446655440001';
  const actionId = '770e8400-e29b-41d4-a716-446655440002';
  const gmUserId = 'user_gm_123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ValidateAnActionController],
      providers: [
        {
          provide: CommandBus,
          useValue: { execute: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    controller = module.get(ValidateAnActionController);
    commandBus = module.get(CommandBus);
  });

  it('should dispatch ValidateActionCommand and return 202', async () => {
    const dto = { narrativeNote: undefined };

    const result = await controller.handle(campaignId, sessionId, actionId, dto, gmUserId);

    expect(result).toBeUndefined();
    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    const command = commandBus.execute.mock.calls[0][0];
    expect(command).toBeInstanceOf(ValidateActionCommand);
    expect(command.actionId).toBe(actionId);
    expect(command.sessionId).toBe(sessionId);
    expect(command.campaignId).toBe(campaignId);
    expect(command.callerUserId).toBe(gmUserId);
    expect(command.narrativeNote).toBeNull();
  });

  it('should pass narrative note when provided', async () => {
    const dto = { narrativeNote: 'The path opens before you' };

    await controller.handle(campaignId, sessionId, actionId, dto, gmUserId);

    const command = commandBus.execute.mock.calls[0][0];
    expect(command.narrativeNote).toBe('The path opens before you');
  });

  it('should dispatch command with correct IDs from route params', async () => {
    const dto = { narrativeNote: undefined };
    const otherCampaignId = '110e8400-e29b-41d4-a716-446655440000';
    const otherSessionId = '220e8400-e29b-41d4-a716-446655440001';
    const otherActionId = '330e8400-e29b-41d4-a716-446655440002';

    await controller.handle(otherCampaignId, otherSessionId, otherActionId, dto, gmUserId);

    const command = commandBus.execute.mock.calls[0][0];
    expect(command.campaignId).toBe(otherCampaignId);
    expect(command.sessionId).toBe(otherSessionId);
    expect(command.actionId).toBe(otherActionId);
  });

  it('should propagate domain exception when commandBus throws', async () => {
    const dto = { narrativeNote: undefined };
    commandBus.execute.mockRejectedValue(new Error('Action not found'));

    await expect(
      controller.handle(campaignId, sessionId, actionId, dto, gmUserId),
    ).rejects.toThrow('Action not found');
  });
});
