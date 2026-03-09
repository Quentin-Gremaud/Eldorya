import {
  Controller,
  Post,
  Body,
  Param,
  UsePipes,
  ValidationPipe,
  HttpCode,
  ForbiddenException,
  NotFoundException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { AuthUserId } from '../../../infrastructure/auth/auth-user-id.decorator.js';
import { CreateACharacterDto } from '../dto/create-a-character.dto.js';
import { CreateACharacterCommand } from '../../../character/character/commands/create-a-character.command.js';
import { CampaignAnnouncementsFinder } from '../../campaign/finders/campaign-announcements.finder.js';

@Controller('campaigns')
export class CreateACharacterController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly campaignAnnouncementsFinder: CampaignAnnouncementsFinder,
  ) {}

  @Post(':campaignId/characters')
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
    @Body() dto: CreateACharacterDto,
    @AuthUserId() userId: string,
  ): Promise<void> {
    const check = await this.campaignAnnouncementsFinder.checkCampaignMembership(
      campaignId,
      userId,
    );
    if (!check.exists) throw new NotFoundException();
    if (!check.isMember) throw new ForbiddenException();

    await this.commandBus.execute(
      new CreateACharacterCommand(
        dto.id,
        userId,
        campaignId,
        dto.name,
        dto.race,
        dto.characterClass,
        dto.background,
        dto.stats,
        dto.spells,
        check.isGm,
      ),
    );
  }
}
