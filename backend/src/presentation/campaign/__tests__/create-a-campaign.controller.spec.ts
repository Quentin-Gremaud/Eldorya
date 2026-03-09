import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { Reflector } from '@nestjs/core';
import { CreateACampaignController } from '../controllers/create-a-campaign.controller.js';
import { CreateACampaignCommand } from '../../../campaign/campaign/commands/create-a-campaign.command.js';
import { IS_PUBLIC_KEY } from '../../../infrastructure/auth/public.decorator.js';

describe('CreateACampaignController', () => {
  let controller: CreateACampaignController;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CreateACampaignController],
      providers: [
        {
          provide: CommandBus,
          useValue: { execute: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    controller = module.get<CreateACampaignController>(
      CreateACampaignController,
    );
    commandBus = module.get(CommandBus);
  });

  it('should dispatch CreateACampaignCommand with correct data', async () => {
    const dto = { id: 'campaign-123', name: 'My Campaign', description: 'A description' };

    await controller.handle(dto as any, 'user-gm-1');

    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    const command = commandBus.execute.mock.calls[0][0];
    expect(command).toBeInstanceOf(CreateACampaignCommand);
    expect(command.campaignId).toBe('campaign-123');
    expect(command.name).toBe('My Campaign');
    expect(command.description).toBe('A description');
    expect(command.userId).toBe('user-gm-1');
  });

  it('should handle missing description', async () => {
    const dto = { id: 'campaign-123', name: 'My Campaign' };

    await controller.handle(dto as any, 'user-gm-1');

    const command = commandBus.execute.mock.calls[0][0];
    expect(command.description).toBe('');
  });

  it('should return void (202 Accepted)', async () => {
    const dto = { id: 'campaign-123', name: 'My Campaign', description: '' };

    const result = await controller.handle(dto as any, 'user-gm-1');

    expect(result).toBeUndefined();
  });

  describe('Auth guard metadata', () => {
    it('should NOT have @Public() decorator — route is protected', () => {
      const reflector = new Reflector();

      const isPublicOnClass = reflector.get<boolean>(
        IS_PUBLIC_KEY,
        CreateACampaignController,
      );
      const isPublicOnHandler = reflector.get<boolean>(
        IS_PUBLIC_KEY,
        CreateACampaignController.prototype.handle,
      );

      expect(isPublicOnClass).toBeFalsy();
      expect(isPublicOnHandler).toBeFalsy();
    });
  });
});
