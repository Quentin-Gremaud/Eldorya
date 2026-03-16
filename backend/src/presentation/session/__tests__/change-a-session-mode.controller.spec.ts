import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ChangeASessionModeController } from '../controllers/change-a-session-mode.controller.js';
import { ChangeSessionModeCommand } from '../../../session/session/commands/change-session-mode.command.js';
import { CampaignDetailFinder } from '../../campaign/finders/campaign-detail.finder.js';

describe('ChangeASessionModeController', () => {
  let controller: ChangeASessionModeController;
  let commandBus: jest.Mocked<CommandBus>;
  let campaignDetailFinder: jest.Mocked<CampaignDetailFinder>;

  const campaignId = '550e8400-e29b-41d4-a716-446655440000';
  const sessionId = '660e8400-e29b-41d4-a716-446655440001';
  const gmUserId = 'user_gm_123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChangeASessionModeController],
      providers: [
        {
          provide: CommandBus,
          useValue: { execute: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: CampaignDetailFinder,
          useValue: {
            findById: jest.fn().mockResolvedValue({ id: campaignId, gmUserId }),
          },
        },
      ],
    }).compile();

    controller = module.get(ChangeASessionModeController);
    commandBus = module.get(CommandBus);
    campaignDetailFinder = module.get(CampaignDetailFinder);
  });

  it('should dispatch ChangeSessionModeCommand and return 202', async () => {
    const result = await controller.handle(campaignId, sessionId, { mode: 'live' }, gmUserId);

    expect(result).toBeUndefined();
    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    const command = commandBus.execute.mock.calls[0][0];
    expect(command).toBeInstanceOf(ChangeSessionModeCommand);
    expect(command.sessionId).toBe(sessionId);
    expect(command.campaignId).toBe(campaignId);
    expect(command.gmUserId).toBe(gmUserId);
    expect(command.newMode).toBe('live');
  });

  it('should throw NotFoundException if campaign does not exist', async () => {
    campaignDetailFinder.findById.mockResolvedValue(null);

    await expect(
      controller.handle(campaignId, sessionId, { mode: 'live' }, gmUserId),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw ForbiddenException if user is not GM', async () => {
    await expect(
      controller.handle(campaignId, sessionId, { mode: 'live' }, 'other-user'),
    ).rejects.toThrow(ForbiddenException);
  });
});
