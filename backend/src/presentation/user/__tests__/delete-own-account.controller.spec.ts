import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { DeleteOwnAccountController } from '../controllers/delete-own-account.controller';
import { RequestAccountDeletionCommand } from '../../../infrastructure/user/commands/request-account-deletion.command';

describe('DeleteOwnAccountController', () => {
  let controller: DeleteOwnAccountController;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeleteOwnAccountController],
      providers: [
        {
          provide: CommandBus,
          useValue: {
            execute: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    controller = module.get<DeleteOwnAccountController>(
      DeleteOwnAccountController,
    );
    commandBus = module.get(CommandBus);
  });

  it('should dispatch RequestAccountDeletionCommand with the authenticated userId', async () => {
    await controller.handle('clerk_user_123');

    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    const command = commandBus.execute.mock.calls[0][0];
    expect(command).toBeInstanceOf(RequestAccountDeletionCommand);
    expect(command.clerkUserId).toBe('clerk_user_123');
  });

  it('should return void (202 Accepted via decorator)', async () => {
    const result = await controller.handle('clerk_user_456');

    expect(result).toBeUndefined();
  });

  it('should propagate errors from command bus', async () => {
    commandBus.execute.mockRejectedValue(new Error('User not found'));

    await expect(controller.handle('unknown_user')).rejects.toThrow(
      'User not found',
    );
  });
});
