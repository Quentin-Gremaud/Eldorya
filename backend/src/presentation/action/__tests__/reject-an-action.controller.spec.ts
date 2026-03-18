import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { RejectAnActionController } from '../controllers/reject-an-action.controller.js';
import { RejectActionCommand } from '../../../session/action-pipeline/commands/reject-action.command.js';

describe('RejectAnActionController', () => {
  let controller: RejectAnActionController;
  let commandBus: jest.Mocked<CommandBus>;

  const campaignId = '550e8400-e29b-41d4-a716-446655440000';
  const sessionId = '660e8400-e29b-41d4-a716-446655440001';
  const actionId = '770e8400-e29b-41d4-a716-446655440002';
  const gmUserId = 'user_gm_123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RejectAnActionController],
      providers: [
        {
          provide: CommandBus,
          useValue: { execute: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    controller = module.get(RejectAnActionController);
    commandBus = module.get(CommandBus);
  });

  it('should dispatch RejectActionCommand and return 202', async () => {
    const dto = { feedback: 'The dragon is too far away' };

    const result = await controller.handle(campaignId, sessionId, actionId, dto, gmUserId);

    expect(result).toBeUndefined();
    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    const command = commandBus.execute.mock.calls[0][0];
    expect(command).toBeInstanceOf(RejectActionCommand);
    expect(command.actionId).toBe(actionId);
    expect(command.sessionId).toBe(sessionId);
    expect(command.campaignId).toBe(campaignId);
    expect(command.callerUserId).toBe(gmUserId);
    expect(command.feedback).toBe('The dragon is too far away');
  });

  it('should dispatch command with correct route params', async () => {
    const dto = { feedback: 'Not allowed' };
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
    const dto = { feedback: 'Some feedback' };
    commandBus.execute.mockRejectedValue(new Error('Action is not in pending status'));

    await expect(
      controller.handle(campaignId, sessionId, actionId, dto, gmUserId),
    ).rejects.toThrow('Action is not in pending status');
  });
});
