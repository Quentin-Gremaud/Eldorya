import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { GetPingStatusController } from '../controllers/get-ping-status.controller.js';
import { SessionFinder } from '../../session/finders/session.finder.js';
import { ActionFinder } from '../finders/action.finder.js';

describe('GetPingStatusController', () => {
  let controller: GetPingStatusController;
  let sessionFinder: jest.Mocked<SessionFinder>;
  let actionFinder: jest.Mocked<ActionFinder>;

  const campaignId = '550e8400-e29b-41d4-a716-446655440000';
  const sessionId = '660e8400-e29b-41d4-a716-446655440001';
  const gmUserId = 'user_gm_123';
  const playerId = 'user_player_456';

  const liveSession = {
    id: sessionId,
    campaignId,
    gmUserId,
    mode: 'live',
    status: 'active',
    startedAt: '2026-03-18T10:00:00.000Z',
    endedAt: null,
  };

  const pingStatus = {
    playerId,
    pingedAt: '2026-03-18T10:05:00.000Z',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GetPingStatusController],
      providers: [
        {
          provide: SessionFinder,
          useValue: {
            findById: jest.fn().mockResolvedValue(liveSession),
          },
        },
        {
          provide: ActionFinder,
          useValue: {
            findCurrentPingStatus: jest.fn().mockResolvedValue(pingStatus),
            isCampaignMember: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    controller = module.get(GetPingStatusController);
    sessionFinder = module.get(SessionFinder);
    actionFinder = module.get(ActionFinder);
  });

  it('should return ping status for GM without membership check', async () => {
    const result = await controller.handle(campaignId, sessionId, gmUserId);

    expect(result).toEqual({ data: pingStatus });
    expect(actionFinder.isCampaignMember).not.toHaveBeenCalled();
    expect(actionFinder.findCurrentPingStatus).toHaveBeenCalledWith(sessionId, campaignId);
  });

  it('should return ping status for campaign member (player)', async () => {
    const result = await controller.handle(campaignId, sessionId, playerId);

    expect(result).toEqual({ data: pingStatus });
    expect(actionFinder.isCampaignMember).toHaveBeenCalledWith(campaignId, playerId);
  });

  it('should return null data when no ping exists', async () => {
    actionFinder.findCurrentPingStatus.mockResolvedValue(null);

    const result = await controller.handle(campaignId, sessionId, gmUserId);

    expect(result).toEqual({ data: null });
  });

  it('should throw NotFoundException if session does not exist', async () => {
    sessionFinder.findById.mockResolvedValue(null);

    await expect(
      controller.handle(campaignId, sessionId, gmUserId),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw NotFoundException if session belongs to different campaign', async () => {
    sessionFinder.findById.mockResolvedValue({
      ...liveSession,
      campaignId: 'other-campaign',
    });

    await expect(
      controller.handle(campaignId, sessionId, gmUserId),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw ForbiddenException if user is not GM and not a campaign member', async () => {
    actionFinder.isCampaignMember.mockResolvedValue(false);

    await expect(
      controller.handle(campaignId, sessionId, 'unknown-user'),
    ).rejects.toThrow(ForbiddenException);
  });
});
