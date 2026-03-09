import { AddItemToInventoryHandler } from '../commands/add-item-to-inventory.handler.js';
import { AddItemToInventoryCommand } from '../commands/add-item-to-inventory.command.js';
import { Inventory } from '../inventory.aggregate.js';
import type { InventoryRepository } from '../inventory.repository.js';
import type { Clock } from '../../../shared/clock.js';
import type { InventoryItemData } from '../inventory-item.js';

describe('AddItemToInventoryHandler', () => {
  let handler: AddItemToInventoryHandler;
  let mockRepository: jest.Mocked<InventoryRepository>;
  let mockClock: Clock;
  let mockInventory: jest.Mocked<Inventory>;

  const itemData: InventoryItemData = {
    id: 'item-1',
    name: 'Healing Potion',
    description: 'Restores 50 HP',
    weight: 1,
    slotType: 'hands',
    statModifiers: {},
  };

  beforeEach(() => {
    mockInventory = {
      addItem: jest.fn(),
      recordGmModification: jest.fn(),
    } as unknown as jest.Mocked<Inventory>;

    mockRepository = {
      load: jest.fn().mockResolvedValue(mockInventory),
      save: jest.fn().mockResolvedValue(undefined),
      saveNew: jest.fn().mockResolvedValue(undefined),
    };

    mockClock = {
      now: jest.fn().mockReturnValue(new Date('2026-03-08T12:00:00.000Z')),
    };

    handler = new AddItemToInventoryHandler(mockRepository, mockClock);
  });

  it('should load inventory, call addItem, and save', async () => {
    const command = new AddItemToInventoryCommand('char-123', itemData, 'user-1');

    await handler.execute(command);

    expect(mockRepository.load).toHaveBeenCalledWith('char-123');
    expect(mockInventory.addItem).toHaveBeenCalledWith(itemData, mockClock);
    expect(mockInventory.recordGmModification).toHaveBeenCalledWith(
      'user-1',
      'add-item',
      'item-1',
      { itemName: 'Healing Potion', weight: 1, slotType: 'hands' },
      mockClock,
    );
    expect(mockRepository.save).toHaveBeenCalledWith(mockInventory);
  });

  it('should propagate error when repository.load() throws', async () => {
    const error = new Error('Aggregate not found');
    mockRepository.load.mockRejectedValue(error);

    const command = new AddItemToInventoryCommand('char-123', itemData, 'user-1');

    await expect(handler.execute(command)).rejects.toThrow('Aggregate not found');
    expect(mockInventory.addItem).not.toHaveBeenCalled();
    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('should propagate domain exception and not save when aggregate method throws', async () => {
    const domainError = new Error('Invalid item');
    mockInventory.addItem.mockImplementation(() => {
      throw domainError;
    });

    const command = new AddItemToInventoryCommand('char-123', itemData, 'user-1');

    await expect(handler.execute(command)).rejects.toThrow('Invalid item');
    expect(mockRepository.save).not.toHaveBeenCalled();
  });
});
