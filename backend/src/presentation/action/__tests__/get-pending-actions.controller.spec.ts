import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { GetPendingActionsController } from '../controllers/get-pending-actions.controller.js';
import { SessionFinder } from '../../session/finders/session.finder.js';
import { ActionFinder } from '../finders/action.finder.js';

describe('GetPendingActionsController', () => {
  let controller: GetPendingActionsController;
  let sessionFinder: jest.Mocked<SessionFinder>;
  let actionFinder: jest.Mocked<ActionFinder>;

  const campaignId = '550e8400-e29b-41d4-a716-446655440000';
  const sessionId = '660e8400-e29b-41d4-a716-446655440001';
  const gmUserId = 'user_gm_123';

  const liveSession = {
    id: sessionId,
    campaignId,
    gmUserId,
    mode: 'live',
    status: 'active',
    startedAt: '2026-03-18T10:00:00.000Z',
    endedAt: null,
  };

  const pendingActions = [
    {
      id: 'action-1',
      sessionId,
      campaignId,
      playerId: 'player-1',
      actionType: 'move',
      description: 'Move north',
      target: null,
      status: 'pending',
      proposedAt: '2026-03-18T10:05:00.000Z',
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GetPendingActionsController],
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
            findPendingActionsBySession: jest.fn().mockResolvedValue(pendingActions),
          },
        },
      ],
    }).compile();

    controller = module.get(GetPendingActionsController);
    sessionFinder = module.get(SessionFinder);
    actionFinder = module.get(ActionFinder);
  });

  it('should return pending actions for GM', async () => {
    const result = await controller.handle(campaignId, sessionId, gmUserId);

    expect(result).toEqual({ data: pendingActions });
    expect(actionFinder.findPendingActionsBySession).toHaveBeenCalledWith(sessionId, campaignId);
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

  it('should throw ForbiddenException if user is not the GM', async () => {
    await expect(
      controller.handle(campaignId, sessionId, 'not-the-gm'),
    ).rejects.toThrow(ForbiddenException);
  });
});
