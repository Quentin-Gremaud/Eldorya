import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { ForbiddenException } from '@nestjs/common';
import { ApproveCharacterModificationController } from '../controllers/approve-character-modification.controller.js';
import { ApproveCharacterModificationCommand } from '../../../character/character/commands/approve-character-modification.command.js';
import { CampaignAnnouncementsFinder } from '../../campaign/finders/campaign-announcements.finder.js';

describe('ApproveCharacterModificationController', () => {
  let controller: ApproveCharacterModificationController;
  let commandBus: jest.Mocked<CommandBus>;
  let campaignFinder: { checkGmOwnership: jest.Mock };

  beforeEach(async () => {
    campaignFinder = {
      checkGmOwnership: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApproveCharacterModificationController],
      providers: [
        {
          provide: CommandBus,
          useValue: { execute: jest.fn().mockResolvedValue(undefined) },
        },
        { provide: CampaignAnnouncementsFinder, useValue: campaignFinder },
      ],
    }).compile();

    controller = module.get<ApproveCharacterModificationController>(
      ApproveCharacterModificationController,
    );
    commandBus = module.get(CommandBus);
  });

  it('should dispatch ApproveCharacterModificationCommand', async () => {
    await controller.handle('camp-1', 'char-1', 'gm-user');

    expect(campaignFinder.checkGmOwnership).toHaveBeenCalledWith('camp-1', 'gm-user');
    const command = commandBus.execute.mock.calls[0][0];
    expect(command).toBeInstanceOf(ApproveCharacterModificationCommand);
    expect(command.characterId).toBe('char-1');
    expect(command.campaignId).toBe('camp-1');
  });

  it('should throw ForbiddenException when user is not GM', async () => {
    campaignFinder.checkGmOwnership.mockRejectedValue(new ForbiddenException());

    await expect(controller.handle('camp-1', 'char-1', 'not-gm')).rejects.toThrow(ForbiddenException);
    expect(commandBus.execute).not.toHaveBeenCalled();
  });
});
