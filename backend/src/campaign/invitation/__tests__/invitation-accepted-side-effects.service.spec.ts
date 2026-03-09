import { InvitationAcceptedSideEffectsService } from '../services/invitation-accepted-side-effects.service.js';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';

describe('InvitationAcceptedSideEffectsService', () => {
  let service: InvitationAcceptedSideEffectsService;
  let prisma: { $transaction: jest.Mock };
  let txMock: {
    campaignMember: { findUnique: jest.Mock; create: jest.Mock };
    campaign: { update: jest.Mock };
  };

  const campaignId = 'campaign-456';
  const userId = 'user-player-1';

  beforeEach(() => {
    txMock = {
      campaignMember: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'member-1' }),
      },
      campaign: {
        update: jest.fn().mockResolvedValue({ id: campaignId, playerCount: 2 }),
      },
    };

    prisma = {
      // Interactive transaction: execute the callback with our tx mock
      $transaction: jest
        .fn()
        .mockImplementation(
          async (cb: (tx: typeof txMock) => Promise<void>) => {
            return cb(txMock);
          },
        ),
    };

    service = new InvitationAcceptedSideEffectsService(
      prisma as unknown as PrismaService,
    );
  });

  it('should create CampaignMember record with player role', async () => {
    await service.execute(campaignId, userId);

    expect(txMock.campaignMember.create).toHaveBeenCalledWith({
      data: {
        campaignId,
        userId,
        role: 'player',
      },
    });
  });

  it('should increment playerCount on Campaign', async () => {
    await service.execute(campaignId, userId);

    expect(txMock.campaign.update).toHaveBeenCalledWith({
      where: { id: campaignId },
      data: { playerCount: { increment: 1 } },
    });
  });

  it('should wrap both operations in an interactive transaction', async () => {
    await service.execute(campaignId, userId);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    // Verify it was called with a function (interactive transaction pattern)
    expect(typeof prisma.$transaction.mock.calls[0][0]).toBe('function');
  });

  it('should check for existing CampaignMember before creating', async () => {
    await service.execute(campaignId, userId);

    expect(txMock.campaignMember.findUnique).toHaveBeenCalledWith({
      where: { campaignId_userId: { campaignId, userId } },
    });
  });

  it('should skip creation when CampaignMember already exists (idempotent)', async () => {
    txMock.campaignMember.findUnique.mockResolvedValue({
      id: 'existing-member',
      campaignId,
      userId,
      role: 'player',
    });

    await service.execute(campaignId, userId);

    expect(txMock.campaignMember.findUnique).toHaveBeenCalledTimes(1);
    expect(txMock.campaignMember.create).not.toHaveBeenCalled();
    expect(txMock.campaign.update).not.toHaveBeenCalled();
  });
});
