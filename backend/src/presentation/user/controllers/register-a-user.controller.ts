import {
  Controller,
  Post,
  Body,
  HttpCode,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { RegisterUserDto } from '../dto/register-user.dto.js';
import { RegisterAUserCommand } from '../../../infrastructure/user/commands/register-a-user.command.js';
import { Public } from '../../../infrastructure/auth/public.decorator.js';

@Controller('users')
export class RegisterAUserController {
  constructor(private readonly commandBus: CommandBus) {}

  @Public()
  @Post('register')
  @HttpCode(202)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async handle(@Body() dto: RegisterUserDto): Promise<void> {
    await this.commandBus.execute(
      new RegisterAUserCommand(
        dto.clerkUserId,
        dto.email,
        dto.firstName,
        dto.lastName,
        dto.ageDeclaration,
        dto.ageDeclarationTimestamp,
        dto.createdAt,
      ),
    );
  }
}
