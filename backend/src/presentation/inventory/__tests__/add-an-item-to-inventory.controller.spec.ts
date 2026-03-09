import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AddAnItemToInventoryController } from '../controllers/add-an-item-to-inventory.controller.js';
import { AddItemToInventoryCommand } from '../../../character/inventory/commands/add-item-to-inventory.command.js';
import { InventoryGmFinder } from '../finders/inventory-gm.finder.js';

describe('AddAnItemToInventoryController', () => {
  let controller: AddAnItemToInventoryController;
  let commandBus: jest.Mocked<CommandBus>;
  let inventoryGmFinder: { verifyGmOwnership: jest.Mock };

  beforeEach(async () => {
    inventoryGmFinder = {
      verifyGmOwnership: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AddAnItemToInventoryController],
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

    controller = module.get<AddAnItemToInventoryController>(AddAnItemToInventoryController);
    commandBus = module.get(CommandBus);
  });

  const dto = {
    itemId: 'item-1',
    name: 'Healing Potion',
    description: 'Restores 50 HP',
    weight: 1,
    slotType: 'hands',
    statModifiers: { constitution: 2 },
  };

  it('should dispatch AddItemToInventoryCommand with correct data', async () => {
    await controller.handle('campaign-1', 'char-123', dto as any, 'gm-user');

    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    const command = commandBus.execute.mock.calls[0][0];
    expect(command).toBeInstanceOf(AddItemToInventoryCommand);
    expect(command.characterId).toBe('char-123');
    expect(command.item.id).toBe('item-1');
    expect(command.item.name).toBe('Healing Potion');
    expect(command.item.description).toBe('Restores 50 HP');
    expect(command.item.weight).toBe(1);
    expect(command.item.slotType).toBe('hands');
    expect(command.item.statModifiers).toEqual({ constitution: 2 });
    expect(command.userId).toBe('gm-user');
  });

  it('should return void (202 Accepted)', async () => {
    const result = await controller.handle('campaign-1', 'char-123', dto as any, 'gm-user');
    expect(result).toBeUndefined();
  });

  it('should default description to empty string when not provided', async () => {
    const dtoWithoutDesc = { ...dto, description: undefined };
    await controller.handle('campaign-1', 'char-123', dtoWithoutDesc as any, 'gm-user');

    const command = commandBus.execute.mock.calls[0][0];
    expect(command.item.description).toBe('');
  });

  it('should default statModifiers to empty object when not provided', async () => {
    const dtoWithoutMods = { ...dto, statModifiers: undefined };
    await controller.handle('campaign-1', 'char-123', dtoWithoutMods as any, 'gm-user');

    const command = commandBus.execute.mock.calls[0][0];
    expect(command.item.statModifiers).toEqual({});
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
    inventoryGmFinder.verifyGmOwnership.mockRejectedValue(
      new ForbiddenException(),
    );

    await expect(
      controller.handle('campaign-1', 'char-123', dto as any, 'not-gm'),
    ).rejects.toThrow(ForbiddenException);

    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException when campaign not found', async () => {
    inventoryGmFinder.verifyGmOwnership.mockRejectedValue(
      new NotFoundException(),
    );

    await expect(
      controller.handle('bad-campaign', 'char-123', dto as any, 'gm-user'),
    ).rejects.toThrow(NotFoundException);

    expect(commandBus.execute).not.toHaveBeenCalled();
  });
});
