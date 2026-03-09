import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { Reflector } from '@nestjs/core';
import { AcceptInvitationController } from '../controllers/accept-invitation.controller.js';
import { InvitationFinder } from '../finders/invitation.finder.js';
import { AcceptInvitationCommand } from '../../../campaign/invitation/commands/accept-invitation.command.js';
import { InvitationNotFoundException } from '../../../campaign/invitation/exceptions/invitation-not-found.exception.js';
import { IS_PUBLIC_KEY } from '../../../infrastructure/auth/public.decorator.js';

describe('AcceptInvitationController', () => {
  let controller: AcceptInvitationController;
  let commandBus: jest.Mocked<CommandBus>;
  let invitationFinder: { findActiveByTokenHash: jest.Mock };

  beforeEach(async () => {
    invitationFinder = {
      findActiveByTokenHash: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AcceptInvitationController],
      providers: [
        {
          provide: CommandBus,
          useValue: { execute: jest.fn().mockResolvedValue(undefined) },
        },
        { provide: InvitationFinder, useValue: invitationFinder },
      ],
    }).compile();

    controller = module.get<AcceptInvitationController>(
      AcceptInvitationController,
    );
    commandBus = module.get(CommandBus);
  });

  it('should return 200 with campaignId on successful accept', async () => {
    invitationFinder.findActiveByTokenHash.mockResolvedValue({
      id: 'inv-123',
      campaignId: 'campaign-456',
      campaignName: 'Dragon Quest',
      status: 'active',
      expiresAt: null,
    });

    const result = await controller.handle(
      'some-raw-token-value-long-enough',
      'user-player-1',
    );

    expect(result.data.campaignId).toBe('campaign-456');
  });

  it('should dispatch AcceptInvitationCommand with correct invitationId and userId', async () => {
    invitationFinder.findActiveByTokenHash.mockResolvedValue({
      id: 'inv-123',
      campaignId: 'campaign-456',
      campaignName: 'Dragon Quest',
      status: 'active',
      expiresAt: null,
    });

    await controller.handle(
      'some-raw-token-value-long-enough',
      'user-player-1',
    );

    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    const command = commandBus.execute.mock.calls[0][0];
    expect(command).toBeInstanceOf(AcceptInvitationCommand);
    expect(command.invitationId).toBe('inv-123');
    expect(command.campaignId).toBe('campaign-456');
    expect(command.acceptedByUserId).toBe('user-player-1');
  });

  it('should throw InvitationNotFoundException when invitation not found', async () => {
    invitationFinder.findActiveByTokenHash.mockResolvedValue(null);

    await expect(
      controller.handle('unknown-token-value-long-enough', 'user-player-1'),
    ).rejects.toThrow(InvitationNotFoundException);
  });

  describe('Auth guard metadata', () => {
    it('should NOT have @Public() decorator — route is protected by the global guard', () => {
      const reflector = new Reflector();

      const isPublicOnClass = reflector.get<boolean>(
        IS_PUBLIC_KEY,
        AcceptInvitationController,
      );
      const isPublicOnHandler = reflector.get<boolean>(
        IS_PUBLIC_KEY,
        AcceptInvitationController.prototype.handle,
      );

      expect(isPublicOnClass).toBeFalsy();
      expect(isPublicOnHandler).toBeFalsy();
    });
  });
});
