import {
  Controller,
  Post,
  Param,
  Body,
  HttpCode,
  ParseUUIDPipe,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { AuthUserId } from '../../../infrastructure/auth/auth-user-id.decorator.js';
import { RequestCharacterModificationCommand } from '../../../character/character/commands/request-character-modification.command.js';
import { RequestCharacterModificationDto } from '../dto/request-character-modification.dto.js';
import { CharacterOwnershipFinder } from '../finders/character-ownership.finder.js';

@Controller('campaigns')
export class RequestACharacterModificationController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly characterOwnershipFinder: CharacterOwnershipFinder,
  ) {}

  @Post(':campaignId/characters/:characterId/request-modification')
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
    @Body() dto: RequestCharacterModificationDto,
    @AuthUserId() userId: string,
  ): Promise<void> {
    await this.characterOwnershipFinder.verifyOwnership(
      characterId,
      userId,
      campaignId,
    );

    await this.commandBus.execute(
      new RequestCharacterModificationCommand(
        characterId,
        userId,
        campaignId,
        dto.proposedChanges,
        dto.reason ?? null,
      ),
    );
  }
}
