import { ModifyMaxCapacityHandler } from '../commands/modify-max-capacity.handler.js';
import { ModifyMaxCapacityCommand } from '../commands/modify-max-capacity.command.js';
import { Inventory } from '../inventory.aggregate.js';
import type { InventoryRepository } from '../inventory.repository.js';
import type { Clock } from '../../../shared/clock.js';

describe('ModifyMaxCapacityHandler', () => {
  let handler: ModifyMaxCapacityHandler;
  let mockRepository: jest.Mocked<InventoryRepository>;
  let mockClock: Clock;
  let mockInventory: jest.Mocked<Inventory>;

  beforeEach(() => {
    mockInventory = {
      modifyMaxCapacity: jest.fn(),
    } as unknown as jest.Mocked<Inventory>;

    mockRepository = {
      load: jest.fn().mockResolvedValue(mockInventory),
      save: jest.fn().mockResolvedValue(undefined),
      saveNew: jest.fn().mockResolvedValue(undefined),
    };

    mockClock = {
      now: jest.fn().mockReturnValue(new Date('2026-03-08T12:00:00.000Z')),
    };

    handler = new ModifyMaxCapacityHandler(mockRepository, mockClock);
  });

  it('should load inventory, call modifyMaxCapacity, and save', async () => {
    const command = new ModifyMaxCapacityCommand('char-123', 30, 'user-1');

    await handler.execute(command);

    expect(mockRepository.load).toHaveBeenCalledWith('char-123');
    expect(mockInventory.modifyMaxCapacity).toHaveBeenCalledWith(30, 'user-1', mockClock);
    expect(mockRepository.save).toHaveBeenCalledWith(mockInventory);
  });

  it('should propagate error when repository.load() throws', async () => {
    const error = new Error('Aggregate not found');
    mockRepository.load.mockRejectedValue(error);

    const command = new ModifyMaxCapacityCommand('char-123', 30, 'user-1');

    await expect(handler.execute(command)).rejects.toThrow('Aggregate not found');
    expect(mockInventory.modifyMaxCapacity).not.toHaveBeenCalled();
    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('should propagate domain exception and not save when aggregate method throws', async () => {
    const domainError = new Error('Invalid max capacity');
    mockInventory.modifyMaxCapacity.mockImplementation(() => {
      throw domainError;
    });

    const command = new ModifyMaxCapacityCommand('char-123', -5, 'user-1');

    await expect(handler.execute(command)).rejects.toThrow('Invalid max capacity');
    expect(mockRepository.save).not.toHaveBeenCalled();
  });
});
