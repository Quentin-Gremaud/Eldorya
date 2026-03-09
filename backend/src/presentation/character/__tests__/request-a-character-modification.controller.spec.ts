import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { RequestACharacterModificationController } from '../controllers/request-a-character-modification.controller.js';
import { RequestCharacterModificationCommand } from '../../../character/character/commands/request-character-modification.command.js';
import { CharacterOwnershipFinder } from '../finders/character-ownership.finder.js';

describe('RequestACharacterModificationController', () => {
  let controller: RequestACharacterModificationController;
  let commandBus: jest.Mocked<CommandBus>;
  let ownershipFinder: { verifyOwnership: jest.Mock };

  beforeEach(async () => {
    ownershipFinder = {
      verifyOwnership: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RequestACharacterModificationController],
      providers: [
        {
          provide: CommandBus,
          useValue: { execute: jest.fn().mockResolvedValue(undefined) },
        },
        { provide: CharacterOwnershipFinder, useValue: ownershipFinder },
      ],
    }).compile();

    controller = module.get<RequestACharacterModificationController>(
      RequestACharacterModificationController,
    );
    commandBus = module.get(CommandBus);
  });

  it('should dispatch RequestCharacterModificationCommand', async () => {
    const dto = {
      commandId: '550e8400-e29b-41d4-a716-446655440000',
      proposedChanges: { name: { current: 'Thorin', proposed: 'Thorin II' } },
      reason: 'Want a new name',
    };

    await controller.handle('camp-1', 'char-1', dto as any, 'player-1');

    expect(ownershipFinder.verifyOwnership).toHaveBeenCalledWith(
      'char-1',
      'player-1',
      'camp-1',
    );
    const command = commandBus.execute.mock.calls[0][0];
    expect(command).toBeInstanceOf(RequestCharacterModificationCommand);
    expect(command.characterId).toBe('char-1');
    expect(command.playerId).toBe('player-1');
    expect(command.campaignId).toBe('camp-1');
    expect(command.proposedChanges).toEqual({
      name: { current: 'Thorin', proposed: 'Thorin II' },
    });
    expect(command.reason).toBe('Want a new name');
  });

  it('should throw ForbiddenException when user does not own character', async () => {
    ownershipFinder.verifyOwnership.mockRejectedValue(
      new ForbiddenException(),
    );

    const dto = {
      commandId: '550e8400-e29b-41d4-a716-446655440000',
      proposedChanges: { name: { current: 'Thorin', proposed: 'Thorin II' } },
    };

    await expect(
      controller.handle('camp-1', 'char-1', dto as any, 'other-user'),
    ).rejects.toThrow(ForbiddenException);
    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException when character not found', async () => {
    ownershipFinder.verifyOwnership.mockRejectedValue(
      new NotFoundException(),
    );

    const dto = {
      commandId: '550e8400-e29b-41d4-a716-446655440000',
      proposedChanges: {},
    };

    await expect(
      controller.handle('camp-1', 'char-999', dto as any, 'player-1'),
    ).rejects.toThrow(NotFoundException);
    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('should pass null reason when not provided', async () => {
    const dto = {
      commandId: '550e8400-e29b-41d4-a716-446655440000',
      proposedChanges: { name: { current: 'Thorin', proposed: 'Thorin II' } },
    };

    await controller.handle('camp-1', 'char-1', dto as any, 'player-1');

    const command = commandBus.execute.mock.calls[0][0];
    expect(command.reason).toBeNull();
  });
});
