import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { ForbiddenException } from '@nestjs/common';
import { RejectCharacterModificationController } from '../controllers/reject-character-modification.controller.js';
import { RejectCharacterModificationCommand } from '../../../character/character/commands/reject-character-modification.command.js';
import { CampaignAnnouncementsFinder } from '../../campaign/finders/campaign-announcements.finder.js';

describe('RejectCharacterModificationController', () => {
  let controller: RejectCharacterModificationController;
  let commandBus: jest.Mocked<CommandBus>;
  let campaignFinder: { checkGmOwnership: jest.Mock };

  beforeEach(async () => {
    campaignFinder = {
      checkGmOwnership: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RejectCharacterModificationController],
      providers: [
        {
          provide: CommandBus,
          useValue: { execute: jest.fn().mockResolvedValue(undefined) },
        },
        { provide: CampaignAnnouncementsFinder, useValue: campaignFinder },
      ],
    }).compile();

    controller = module.get<RejectCharacterModificationController>(
      RejectCharacterModificationController,
    );
    commandBus = module.get(CommandBus);
  });

  it('should dispatch RejectCharacterModificationCommand', async () => {
    const dto = { reason: 'Name change not allowed' };
    await controller.handle('camp-1', 'char-1', dto as any, 'gm-user');

    expect(campaignFinder.checkGmOwnership).toHaveBeenCalledWith('camp-1', 'gm-user');
    const command = commandBus.execute.mock.calls[0][0];
    expect(command).toBeInstanceOf(RejectCharacterModificationCommand);
    expect(command.characterId).toBe('char-1');
    expect(command.reason).toBe('Name change not allowed');
  });

  it('should throw ForbiddenException when user is not GM', async () => {
    campaignFinder.checkGmOwnership.mockRejectedValue(new ForbiddenException());
    const dto = { reason: 'Not allowed' };

    await expect(controller.handle('camp-1', 'char-1', dto as any, 'not-gm')).rejects.toThrow(ForbiddenException);
    expect(commandBus.execute).not.toHaveBeenCalled();
  });
});
