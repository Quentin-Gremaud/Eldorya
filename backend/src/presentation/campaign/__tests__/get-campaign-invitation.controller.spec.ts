import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { GetCampaignInvitationController } from '../controllers/get-campaign-invitation.controller.js';
import { InvitationFinder } from '../finders/invitation.finder.js';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import { IS_PUBLIC_KEY } from '../../../infrastructure/auth/public.decorator.js';

describe('GetCampaignInvitationController', () => {
  let controller: GetCampaignInvitationController;
  let invitationFinder: { findActiveByCampaignId: jest.Mock };
  let prisma: { campaign: { findUnique: jest.Mock } };

  const campaignId = 'campaign-456';
  const gmUserId = 'user-gm-1';

  beforeEach(async () => {
    invitationFinder = {
      findActiveByCampaignId: jest.fn(),
    };

    prisma = {
      campaign: {
        findUnique: jest.fn().mockResolvedValue({ gmUserId }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GetCampaignInvitationController],
      providers: [
        { provide: InvitationFinder, useValue: invitationFinder },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    controller = module.get<GetCampaignInvitationController>(
      GetCampaignInvitationController,
    );
  });

  it('should return invitation details when active invitation exists', async () => {
    invitationFinder.findActiveByCampaignId.mockResolvedValue({
      id: 'inv-123',
      campaignId,
      createdAt: new Date('2026-03-01T12:00:00Z'),
      expiresAt: new Date('2026-03-08T12:00:00Z'),
      status: 'active',
    });

    const result = await controller.handle(campaignId, gmUserId);

    expect(result.data).not.toBeNull();
    expect(result.data!.id).toBe('inv-123');
    expect(result.data!.campaignId).toBe(campaignId);
    expect(result.data!.createdAt).toBe('2026-03-01T12:00:00.000Z');
    expect(result.data!.expiresAt).toBe('2026-03-08T12:00:00.000Z');
    expect(result.data!.status).toBe('active');
  });

  it('should return { data: null } when no active invitation exists', async () => {
    invitationFinder.findActiveByCampaignId.mockResolvedValue(null);

    const result = await controller.handle(campaignId, gmUserId);

    expect(result.data).toBeNull();
  });

  it('should throw ForbiddenException when user is not the GM', async () => {
    await expect(
      controller.handle(campaignId, 'non-gm-user'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should throw NotFoundException when campaign does not exist', async () => {
    prisma.campaign.findUnique.mockResolvedValue(null);

    await expect(controller.handle(campaignId, gmUserId)).rejects.toThrow(
      NotFoundException,
    );
  });

  describe('Auth guard metadata', () => {
    it('should NOT have @Public() decorator — route is protected by the global guard', () => {
      const reflector = new Reflector();

      const isPublicOnClass = reflector.get<boolean>(
        IS_PUBLIC_KEY,
        GetCampaignInvitationController,
      );
      const isPublicOnHandler = reflector.get<boolean>(
        IS_PUBLIC_KEY,
        GetCampaignInvitationController.prototype.handle,
      );

      expect(isPublicOnClass).toBeFalsy();
      expect(isPublicOnHandler).toBeFalsy();
    });
  });
});
