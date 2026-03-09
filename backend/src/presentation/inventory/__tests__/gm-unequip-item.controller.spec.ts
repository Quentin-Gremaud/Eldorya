import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { ForbiddenException } from '@nestjs/common';
import { GmUnequipItemController } from '../controllers/gm-unequip-item.controller.js';
import { UnequipItemCommand } from '../../../character/inventory/commands/unequip-item.command.js';
import { InventoryGmFinder } from '../finders/inventory-gm.finder.js';

describe('GmUnequipItemController', () => {
  let controller: GmUnequipItemController;
  let commandBus: jest.Mocked<CommandBus>;
  let inventoryGmFinder: { verifyGmOwnership: jest.Mock };

  beforeEach(async () => {
    inventoryGmFinder = {
      verifyGmOwnership: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GmUnequipItemController],
      providers: [
        {
          provide: CommandBus,
          useValue: { execute: jest.fn().mockResolvedValue(undefined) },
        },
        { provide: InventoryGmFinder, useValue: inventoryGmFinder },
      ],
    }).compile();

    controller = module.get<GmUnequipItemController>(GmUnequipItemController);
    commandBus = module.get(CommandBus);
  });

  it('should dispatch UnequipItemCommand via GM authorization', async () => {
    const dto = { itemId: 'item-1' };
    await controller.handle('campaign-1', 'char-123', dto as any, 'gm-user');

    expect(inventoryGmFinder.verifyGmOwnership).toHaveBeenCalledWith('char-123', 'campaign-1', 'gm-user');
    const command = commandBus.execute.mock.calls[0][0];
    expect(command).toBeInstanceOf(UnequipItemCommand);
    expect(command.characterId).toBe('char-123');
  });

  it('should throw ForbiddenException when user is not GM', async () => {
    inventoryGmFinder.verifyGmOwnership.mockRejectedValue(new ForbiddenException());
    const dto = { itemId: 'item-1' };

    await expect(controller.handle('campaign-1', 'char-123', dto as any, 'not-gm')).rejects.toThrow(ForbiddenException);
    expect(commandBus.execute).not.toHaveBeenCalled();
  });
});
