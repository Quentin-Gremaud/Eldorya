import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { ForbiddenException } from '@nestjs/common';
import { MoveItemController } from '../controllers/move-item.controller.js';
import { MoveItemCommand } from '../../../character/inventory/commands/move-item.command.js';
import { InventoryFinder } from '../finders/inventory.finder.js';

describe('MoveItemController', () => {
  let controller: MoveItemController;
  let commandBus: jest.Mocked<CommandBus>;
  let inventoryFinder: { verifyCharacterOwnership: jest.Mock };

  beforeEach(async () => {
    inventoryFinder = {
      verifyCharacterOwnership: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MoveItemController],
      providers: [
        {
          provide: CommandBus,
          useValue: { execute: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: InventoryFinder,
          useValue: inventoryFinder,
        },
      ],
    }).compile();

    controller = module.get<MoveItemController>(MoveItemController);
    commandBus = module.get(CommandBus);
  });

  it('should dispatch MoveItemCommand with correct data', async () => {
    const dto = { itemId: 'item-1', toPosition: 5 };

    await controller.handle('campaign-1', 'char-123', dto as any, 'user-1');

    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    const command = commandBus.execute.mock.calls[0][0];
    expect(command).toBeInstanceOf(MoveItemCommand);
    expect(command.characterId).toBe('char-123');
    expect(command.itemId).toBe('item-1');
    expect(command.toPosition).toBe(5);
  });

  it('should return void (202 Accepted)', async () => {
    const dto = { itemId: 'item-1', toPosition: 5 };
    const result = await controller.handle('campaign-1', 'char-123', dto as any, 'user-1');
    expect(result).toBeUndefined();
  });

  it('should verify character ownership before dispatching', async () => {
    const dto = { itemId: 'item-1', toPosition: 5 };
    await controller.handle('campaign-1', 'char-123', dto as any, 'user-1');

    expect(inventoryFinder.verifyCharacterOwnership).toHaveBeenCalledWith(
      'char-123',
      'user-1',
      'campaign-1',
    );
  });

  it('should throw ForbiddenException when user does not own character', async () => {
    inventoryFinder.verifyCharacterOwnership.mockRejectedValue(
      new ForbiddenException(),
    );

    const dto = { itemId: 'item-1', toPosition: 5 };

    await expect(
      controller.handle('campaign-1', 'char-123', dto as any, 'wrong-user'),
    ).rejects.toThrow(ForbiddenException);

    expect(commandBus.execute).not.toHaveBeenCalled();
  });
});
