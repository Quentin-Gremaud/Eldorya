import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { ReorderActionQueueController } from '../controllers/reorder-action-queue.controller.js';
import { ReorderActionQueueCommand } from '../../../session/action-pipeline/commands/reorder-action-queue.command.js';

describe('ReorderActionQueueController', () => {
  let controller: ReorderActionQueueController;
  let commandBus: jest.Mocked<CommandBus>;

  const campaignId = '550e8400-e29b-41d4-a716-446655440000';
  const sessionId = '660e8400-e29b-41d4-a716-446655440001';
  const gmUserId = 'user_gm_123';
  const actionId1 = '770e8400-e29b-41d4-a716-446655440002';
  const actionId2 = '770e8400-e29b-41d4-a716-446655440003';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReorderActionQueueController],
      providers: [
        {
          provide: CommandBus,
          useValue: { execute: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    controller = module.get(ReorderActionQueueController);
    commandBus = module.get(CommandBus);
  });

  it('should dispatch ReorderActionQueueCommand and return 202', async () => {
    const dto = { orderedActionIds: [actionId2, actionId1] };

    const result = await controller.handle(campaignId, sessionId, dto, gmUserId);

    expect(result).toBeUndefined();
    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    const command = commandBus.execute.mock.calls[0][0];
    expect(command).toBeInstanceOf(ReorderActionQueueCommand);
    expect(command.sessionId).toBe(sessionId);
    expect(command.campaignId).toBe(campaignId);
    expect(command.orderedActionIds).toEqual([actionId2, actionId1]);
    expect(command.callerUserId).toBe(gmUserId);
  });

  it('should dispatch command with correct IDs from route params', async () => {
    const dto = { orderedActionIds: [actionId1] };
    const otherCampaignId = '110e8400-e29b-41d4-a716-446655440000';
    const otherSessionId = '220e8400-e29b-41d4-a716-446655440001';

    await controller.handle(otherCampaignId, otherSessionId, dto, gmUserId);

    const command = commandBus.execute.mock.calls[0][0];
    expect(command.campaignId).toBe(otherCampaignId);
    expect(command.sessionId).toBe(otherSessionId);
  });

  it('should propagate domain exception when commandBus throws', async () => {
    const dto = { orderedActionIds: [actionId1] };
    commandBus.execute.mockRejectedValue(new Error('Queue reorder failed'));

    await expect(
      controller.handle(campaignId, sessionId, dto, gmUserId),
    ).rejects.toThrow('Queue reorder failed');
  });

  it('should dispatch command with empty array when provided', async () => {
    const dto = { orderedActionIds: [] as string[] };

    await controller.handle(campaignId, sessionId, dto, gmUserId);

    const command = commandBus.execute.mock.calls[0][0];
    expect(command.orderedActionIds).toEqual([]);
  });
});
