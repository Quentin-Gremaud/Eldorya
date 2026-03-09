import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { RegisterAUserController } from '../controllers/register-a-user.controller';
import { RegisterAUserCommand } from '../../../infrastructure/user/commands/register-a-user.command';

describe('RegisterAUserController', () => {
  let controller: RegisterAUserController;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RegisterAUserController],
      providers: [
        {
          provide: CommandBus,
          useValue: {
            execute: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    controller = module.get<RegisterAUserController>(RegisterAUserController);
    commandBus = module.get(CommandBus);
  });

  it('should dispatch RegisterAUserCommand via CommandBus', async () => {
    const dto = {
      clerkUserId: 'clerk_user_123',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      ageDeclaration: true,
      ageDeclarationTimestamp: '2026-01-01T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    await controller.handle(dto);

    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    const command = commandBus.execute.mock.calls[0][0];
    expect(command).toBeInstanceOf(RegisterAUserCommand);
    expect(command.clerkUserId).toBe('clerk_user_123');
    expect(command.email).toBe('test@example.com');
    expect(command.firstName).toBe('John');
    expect(command.lastName).toBe('Doe');
    expect(command.ageDeclaration).toBe(true);
  });

  it('should return void (202 Accepted with no body)', async () => {
    const dto = {
      clerkUserId: 'clerk_user_456',
      email: 'test@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
      ageDeclaration: true,
      ageDeclarationTimestamp: '2026-01-01T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    const result = await controller.handle(dto);
    expect(result).toBeUndefined();
  });
});
