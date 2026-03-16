import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { StartASessionController } from '../controllers/start-a-session.controller.js';
import { StartSessionCommand } from '../../../session/session/commands/start-session.command.js';
import { CampaignDetailFinder } from '../../campaign/finders/campaign-detail.finder.js';
import { SessionFinder } from '../finders/session.finder.js';

describe('StartASessionController', () => {
  let controller: StartASessionController;
  let commandBus: jest.Mocked<CommandBus>;
  let campaignDetailFinder: jest.Mocked<CampaignDetailFinder>;
  let sessionFinder: jest.Mocked<SessionFinder>;

  const campaignId = '550e8400-e29b-41d4-a716-446655440000';
  const sessionId = '660e8400-e29b-41d4-a716-446655440001';
  const gmUserId = 'user_gm_123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StartASessionController],
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
        {
          provide: SessionFinder,
          useValue: {
            findActiveSessionByCampaign: jest.fn().mockResolvedValue(null),
          },
        },
      ],
    }).compile();

    controller = module.get(StartASessionController);
    commandBus = module.get(CommandBus);
    campaignDetailFinder = module.get(CampaignDetailFinder);
    sessionFinder = module.get(SessionFinder);
  });

  it('should dispatch StartSessionCommand and return 202', async () => {
    const result = await controller.handle(campaignId, { sessionId }, gmUserId);

    expect(result).toBeUndefined();
    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    const command = commandBus.execute.mock.calls[0][0];
    expect(command).toBeInstanceOf(StartSessionCommand);
    expect(command.sessionId).toBe(sessionId);
    expect(command.campaignId).toBe(campaignId);
    expect(command.gmUserId).toBe(gmUserId);
  });

  it('should throw NotFoundException if campaign does not exist', async () => {
    campaignDetailFinder.findById.mockResolvedValue(null);

    await expect(
      controller.handle(campaignId, { sessionId }, gmUserId),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw ForbiddenException if user is not GM', async () => {
    await expect(
      controller.handle(campaignId, { sessionId }, 'other-user'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should throw ConflictException if active session already exists', async () => {
    sessionFinder.findActiveSessionByCampaign.mockResolvedValue({
      id: 'existing-session',
      campaignId,
      gmUserId,
      mode: 'preparation',
      status: 'active',
      startedAt: '2026-03-14T10:00:00.000Z',
      endedAt: null,
    });

    await expect(
      controller.handle(campaignId, { sessionId }, gmUserId),
    ).rejects.toThrow(ConflictException);
  });

  it('should check for active session before dispatching command', async () => {
    await controller.handle(campaignId, { sessionId }, gmUserId);

    expect(sessionFinder.findActiveSessionByCampaign).toHaveBeenCalledWith(campaignId);
  });
});
