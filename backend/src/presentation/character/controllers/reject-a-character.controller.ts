import {
  Controller,
  Post,
  Body,
  Param,
  UsePipes,
  ValidationPipe,
  HttpCode,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { AuthUserId } from '../../../infrastructure/auth/auth-user-id.decorator.js';
import { RejectACharacterDto } from '../dto/reject-a-character.dto.js';
import { RejectACharacterCommand } from '../../../character/character/commands/reject-a-character.command.js';
import { CampaignAnnouncementsFinder } from '../../campaign/finders/campaign-announcements.finder.js';

@Controller('campaigns')
export class RejectACharacterController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly campaignAnnouncementsFinder: CampaignAnnouncementsFinder,
  ) {}

  @Post(':campaignId/characters/:characterId/reject')
  @HttpCode(202)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async handle(
    @Param('campaignId', new ParseUUIDPipe()) campaignId: string,
    @Param('characterId', new ParseUUIDPipe()) characterId: string,
    @Body() dto: RejectACharacterDto,
    @AuthUserId() userId: string,
  ): Promise<void> {
    await this.campaignAnnouncementsFinder.checkGmOwnership(campaignId, userId);

    await this.commandBus.execute(
      new RejectACharacterCommand(characterId, userId, dto.reason),
    );
  }
}
