import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ValidateInvitationController } from '../controllers/validate-invitation.controller.js';
import { InvitationFinder } from '../finders/invitation.finder.js';
import { IS_PUBLIC_KEY } from '../../../infrastructure/auth/public.decorator.js';

describe('ValidateInvitationController', () => {
  let controller: ValidateInvitationController;
  let invitationFinder: { findActiveByTokenHash: jest.Mock };

  beforeEach(async () => {
    invitationFinder = {
      findActiveByTokenHash: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ValidateInvitationController],
      providers: [{ provide: InvitationFinder, useValue: invitationFinder }],
    }).compile();

    controller = module.get<ValidateInvitationController>(
      ValidateInvitationController,
    );
  });

  it('should return valid:true for active invitation', async () => {
    invitationFinder.findActiveByTokenHash.mockResolvedValue({
      id: 'inv-123',
      campaignId: 'campaign-456',
      campaignName: 'Dragon Quest',
      status: 'active',
      expiresAt: new Date('2099-12-31T23:59:59Z'),
    });

    const result = await controller.handle('some-raw-token-value-long-enough');

    expect(result.data.valid).toBe(true);
    expect(result.data.campaignId).toBe('campaign-456');
    expect(result.data.campaignName).toBe('Dragon Quest');
  });

  it('should return valid:false for expired invitation', async () => {
    invitationFinder.findActiveByTokenHash.mockResolvedValue({
      id: 'inv-123',
      campaignId: 'campaign-456',
      campaignName: 'Dragon Quest',
      status: 'active',
      expiresAt: new Date('2020-01-01T00:00:00Z'), // Past date
    });

    const result = await controller.handle('some-raw-token-value-long-enough');

    expect(result.data.valid).toBe(false);
    expect(result.data.expired).toBe(true);
  });

  it('should return valid:false when invitation not found', async () => {
    invitationFinder.findActiveByTokenHash.mockResolvedValue(null);

    const result = await controller.handle('unknown-token-value-long-enough');

    expect(result.data.valid).toBe(false);
  });

  it('should return valid:true for invitation with no expiry', async () => {
    invitationFinder.findActiveByTokenHash.mockResolvedValue({
      id: 'inv-123',
      campaignId: 'campaign-456',
      campaignName: 'Eternal Campaign',
      status: 'active',
      expiresAt: null,
    });

    const result = await controller.handle('some-raw-token-value-long-enough');

    expect(result.data.valid).toBe(true);
  });

  describe('Auth guard metadata', () => {
    it('should have @Public() decorator on the handle method — route is accessible without authentication', () => {
      const reflector = new Reflector();

      const isPublicOnHandler = reflector.get<boolean>(
        IS_PUBLIC_KEY,
        ValidateInvitationController.prototype.handle,
      );

      expect(isPublicOnHandler).toBe(true);
    });
  });
});
