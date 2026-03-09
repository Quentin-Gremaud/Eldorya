import { createHash } from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { CreateCampaignInvitationController } from '../controllers/create-campaign-invitation.controller.js';
import { CreateInvitationCommand } from '../../../campaign/invitation/commands/create-invitation.command.js';
import { CreateInvitationDto } from '../dto/create-invitation.dto.js';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import { IS_PUBLIC_KEY } from '../../../infrastructure/auth/public.decorator.js';

describe('CreateCampaignInvitationController', () => {
  let controller: CreateCampaignInvitationController;
  let commandBus: jest.Mocked<CommandBus>;
  let prisma: { campaign: { findUnique: jest.Mock } };

  beforeEach(async () => {
    prisma = {
      campaign: {
        findUnique: jest.fn().mockResolvedValue({ gmUserId: 'user-gm-1' }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CreateCampaignInvitationController],
      providers: [
        {
          provide: CommandBus,
          useValue: { execute: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('http://localhost:3000') },
        },
      ],
    }).compile();

    controller = module.get<CreateCampaignInvitationController>(
      CreateCampaignInvitationController,
    );
    commandBus = module.get(CommandBus);
  });

  it('should dispatch CreateInvitationCommand with correct campaignId and userId', async () => {
    const dto = new CreateInvitationDto();
    dto.expiresInDays = 7;

    await controller.handle('campaign-456', dto, 'user-gm-1');

    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    const command = commandBus.execute.mock.calls[0][0];
    expect(command).toBeInstanceOf(CreateInvitationCommand);
    expect(command.campaignId).toBe('campaign-456');
    expect(command.createdByUserId).toBe('user-gm-1');
    expect(command.tokenHash).toBeDefined();
    expect(command.tokenHash.length).toBeGreaterThan(0);
    expect(command.expiresAt).toBeInstanceOf(Date);
  });

  it('should return 200 with token, inviteUrl and expiresAt', async () => {
    const dto = new CreateInvitationDto();
    dto.expiresInDays = 7;

    const result = await controller.handle('campaign-456', dto, 'user-gm-1');

    expect(result.data.token).toBeDefined();
    expect(result.data.token.length).toBeGreaterThan(0);
    expect(result.data.inviteUrl).toContain('/invite/');
    expect(result.data.inviteUrl).toContain(result.data.token);
    expect(result.data.expiresAt).toBeDefined();
  });

  it('should generate a secure token (base64url, 43+ chars)', async () => {
    const dto = new CreateInvitationDto();

    const result = await controller.handle('campaign-456', dto, 'user-gm-1');

    // base64url encoding of 32 bytes = 43 characters
    expect(result.data.token.length).toBe(43);
    expect(result.data.token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('should hash the raw token via InvitationToken.fromRawToken and pass hash to command', async () => {
    const dto = new CreateInvitationDto();
    dto.expiresInDays = 7;

    const result = await controller.handle('campaign-456', dto, 'user-gm-1');

    const command = commandBus.execute.mock
      .calls[0][0] as CreateInvitationCommand;
    const rawToken = result.data.token;

    // The tokenHash in the command should be the SHA-256 hash of the raw token
    const expectedHash = createHash('sha256').update(rawToken).digest('hex');
    expect(command.tokenHash).toBe(expectedHash);

    // The raw token must NOT be in the command — only the hash
    expect(command.tokenHash).not.toBe(rawToken);
  });

  describe('Auth guard metadata', () => {
    it('should NOT have @Public() decorator — route is protected by the global guard', () => {
      const reflector = new Reflector();

      const isPublicOnClass = reflector.get<boolean>(
        IS_PUBLIC_KEY,
        CreateCampaignInvitationController,
      );
      const isPublicOnHandler = reflector.get<boolean>(
        IS_PUBLIC_KEY,
        CreateCampaignInvitationController.prototype.handle,
      );

      expect(isPublicOnClass).toBeFalsy();
      expect(isPublicOnHandler).toBeFalsy();
    });
  });
});
