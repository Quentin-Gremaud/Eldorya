import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { Reflector } from '@nestjs/core';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { RevokeACampaignInvitationController } from '../controllers/revoke-a-campaign-invitation.controller.js';
import { RevokeAnInvitationCommand } from '../../../campaign/invitation/commands/revoke-an-invitation.command.js';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import { IS_PUBLIC_KEY } from '../../../infrastructure/auth/public.decorator.js';

describe('RevokeACampaignInvitationController', () => {
  let controller: RevokeACampaignInvitationController;
  let commandBus: jest.Mocked<CommandBus>;
  let prisma: { campaign: { findUnique: jest.Mock } };

  const campaignId = 'campaign-456';
  const invitationId = 'inv-123';
  const gmUserId = 'user-gm-1';

  beforeEach(async () => {
    prisma = {
      campaign: {
        findUnique: jest.fn().mockResolvedValue({ gmUserId }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RevokeACampaignInvitationController],
      providers: [
        {
          provide: CommandBus,
          useValue: { execute: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    controller = module.get<RevokeACampaignInvitationController>(
      RevokeACampaignInvitationController,
    );
    commandBus = module.get(CommandBus);
  });

  it('should dispatch RevokeAnInvitationCommand and return 202', async () => {
    await controller.handle(campaignId, invitationId, gmUserId);

    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    const command = commandBus.execute.mock.calls[0][0];
    expect(command).toBeInstanceOf(RevokeAnInvitationCommand);
    expect(command.invitationId).toBe(invitationId);
    expect(command.campaignId).toBe(campaignId);
    expect(command.revokedByUserId).toBe(gmUserId);
  });

  it('should throw ForbiddenException when user is not the GM', async () => {
    await expect(
      controller.handle(campaignId, invitationId, 'non-gm-user'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException with correct message when user is not the GM', async () => {
    await expect(
      controller.handle(campaignId, invitationId, 'non-gm-user'),
    ).rejects.toThrow('Only the Game Master can revoke invitation links.');
  });

  it('should throw NotFoundException when campaign does not exist', async () => {
    prisma.campaign.findUnique.mockResolvedValue(null);

    await expect(
      controller.handle(campaignId, invitationId, gmUserId),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw NotFoundException with correct message', async () => {
    prisma.campaign.findUnique.mockResolvedValue(null);

    await expect(
      controller.handle(campaignId, invitationId, gmUserId),
    ).rejects.toThrow('Campaign not found.');
  });

  describe('Auth guard metadata', () => {
    it('should NOT have @Public() decorator — route is protected by the global guard', () => {
      const reflector = new Reflector();

      const isPublicOnClass = reflector.get<boolean>(
        IS_PUBLIC_KEY,
        RevokeACampaignInvitationController,
      );
      const isPublicOnHandler = reflector.get<boolean>(
        IS_PUBLIC_KEY,
        RevokeACampaignInvitationController.prototype.handle,
      );

      expect(isPublicOnClass).toBeFalsy();
      expect(isPublicOnHandler).toBeFalsy();
    });
  });
});
