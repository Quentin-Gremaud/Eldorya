import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { RemoveAnItemFromInventoryController } from '../controllers/remove-an-item-from-inventory.controller.js';
import { RemoveItemFromInventoryCommand } from '../../../character/inventory/commands/remove-item-from-inventory.command.js';
import { InventoryGmFinder } from '../finders/inventory-gm.finder.js';

describe('RemoveAnItemFromInventoryController', () => {
  let controller: RemoveAnItemFromInventoryController;
  let commandBus: jest.Mocked<CommandBus>;
  let inventoryGmFinder: { verifyGmOwnership: jest.Mock };

  beforeEach(async () => {
    inventoryGmFinder = {
      verifyGmOwnership: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RemoveAnItemFromInventoryController],
      providers: [
        {
          provide: CommandBus,
          useValue: { execute: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: InventoryGmFinder,
          useValue: inventoryGmFinder,
        },
      ],
    }).compile();

    controller = module.get<RemoveAnItemFromInventoryController>(RemoveAnItemFromInventoryController);
    commandBus = module.get(CommandBus);
  });

  const dto = { itemId: 'item-1' };

  it('should dispatch RemoveItemFromInventoryCommand with correct data', async () => {
    await controller.handle('campaign-1', 'char-123', dto as any, 'gm-user');

    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    const command = commandBus.execute.mock.calls[0][0];
    expect(command).toBeInstanceOf(RemoveItemFromInventoryCommand);
    expect(command.characterId).toBe('char-123');
    expect(command.itemId).toBe('item-1');
    expect(command.userId).toBe('gm-user');
  });

  it('should return void (202 Accepted)', async () => {
    const result = await controller.handle('campaign-1', 'char-123', dto as any, 'gm-user');
    expect(result).toBeUndefined();
  });

  it('should verify GM ownership before dispatching', async () => {
    await controller.handle('campaign-1', 'char-123', dto as any, 'gm-user');

    expect(inventoryGmFinder.verifyGmOwnership).toHaveBeenCalledWith(
      'char-123',
      'campaign-1',
      'gm-user',
    );
  });

  it('should throw ForbiddenException when user is not GM', async () => {
    inventoryGmFinder.verifyGmOwnership.mockRejectedValue(new ForbiddenException());

    await expect(
      controller.handle('campaign-1', 'char-123', dto as any, 'not-gm'),
    ).rejects.toThrow(ForbiddenException);

    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException when campaign not found', async () => {
    inventoryGmFinder.verifyGmOwnership.mockRejectedValue(new NotFoundException());

    await expect(
      controller.handle('bad-campaign', 'char-123', dto as any, 'gm-user'),
    ).rejects.toThrow(NotFoundException);

    expect(commandBus.execute).not.toHaveBeenCalled();
  });
});
