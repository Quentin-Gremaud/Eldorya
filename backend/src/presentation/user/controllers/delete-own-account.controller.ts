import { Controller, Delete, HttpCode } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { AuthUserId } from '../../../infrastructure/auth/auth-user-id.decorator.js';
import { RequestAccountDeletionCommand } from '../../../infrastructure/user/commands/request-account-deletion.command.js';

@Controller('account')
export class DeleteOwnAccountController {
  constructor(private readonly commandBus: CommandBus) {}

  @Delete()
  @HttpCode(202)
  async handle(@AuthUserId() userId: string): Promise<void> {
    await this.commandBus.execute(new RequestAccountDeletionCommand(userId));
  }
}
