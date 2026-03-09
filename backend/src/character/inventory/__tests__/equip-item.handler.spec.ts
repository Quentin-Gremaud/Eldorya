import { EquipItemHandler } from '../commands/equip-item.handler.js';
import { EquipItemCommand } from '../commands/equip-item.command.js';
import { Inventory } from '../inventory.aggregate.js';
import type { InventoryRepository } from '../inventory.repository.js';
import type { Clock } from '../../../shared/clock.js';

describe('EquipItemHandler', () => {
  let handler: EquipItemHandler;
  let mockRepository: jest.Mocked<InventoryRepository>;
  let mockClock: Clock;
  let mockInventory: jest.Mocked<Inventory>;

  beforeEach(() => {
    mockInventory = {
      equipItem: jest.fn(),
    } as unknown as jest.Mocked<Inventory>;

    mockRepository = {
      load: jest.fn().mockResolvedValue(mockInventory),
      save: jest.fn().mockResolvedValue(undefined),
      saveNew: jest.fn().mockResolvedValue(undefined),
    };

    mockClock = {
      now: jest.fn().mockReturnValue(new Date('2026-03-08T12:00:00.000Z')),
    };

    handler = new EquipItemHandler(mockRepository, mockClock);
  });

  it('should load inventory, call equipItem, and save', async () => {
    const command = new EquipItemCommand('char-123', 'item-1', 'weapon_shield', 'user-1');

    await handler.execute(command);

    expect(mockRepository.load).toHaveBeenCalledWith('char-123');
    expect(mockInventory.equipItem).toHaveBeenCalledWith('item-1', 'weapon_shield', mockClock);
    expect(mockRepository.save).toHaveBeenCalledWith(mockInventory);
  });

  it('should propagate error when repository.load() throws', async () => {
    const error = new Error('Aggregate not found');
    mockRepository.load.mockRejectedValue(error);

    const command = new EquipItemCommand('char-123', 'item-1', 'weapon_shield', 'user-1');

    await expect(handler.execute(command)).rejects.toThrow('Aggregate not found');
    expect(mockInventory.equipItem).not.toHaveBeenCalled();
    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('should propagate domain exception and not save when aggregate method throws', async () => {
    const domainError = new Error('Slot already occupied');
    mockInventory.equipItem.mockImplementation(() => {
      throw domainError;
    });

    const command = new EquipItemCommand('char-123', 'item-1', 'weapon_shield', 'user-1');

    await expect(handler.execute(command)).rejects.toThrow('Slot already occupied');
    expect(mockRepository.save).not.toHaveBeenCalled();
  });
});
