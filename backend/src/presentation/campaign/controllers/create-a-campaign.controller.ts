import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  HttpCode,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { AuthUserId } from '../../../infrastructure/auth/auth-user-id.decorator.js';
import { CreateCampaignDto } from '../dto/create-campaign.dto.js';
import { CreateACampaignCommand } from '../../../campaign/campaign/commands/create-a-campaign.command.js';

@Controller('campaigns')
export class CreateACampaignController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @HttpCode(202)
  @UsePipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  )
  async handle(
    @Body() dto: CreateCampaignDto,
    @AuthUserId() userId: string,
  ): Promise<void> {
    await this.commandBus.execute(
      new CreateACampaignCommand(
        dto.id,
        dto.name,
        dto.description ?? '',
        userId,
      ),
    );
  }
}
