import {
  Controller,
  Delete,
  Param,
  HttpCode,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { AuthUserId } from '../../../infrastructure/auth/auth-user-id.decorator.js';
import { RemoveTokenCommand } from '../../../world/token/commands/remove-token.command.js';
import { MapLevelFinder } from '../../map/finders/map-level.finder.js';

@Controller('campaigns')
export class RemoveATokenController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly mapLevelFinder: MapLevelFinder,
  ) {}

  @Delete(':campaignId/tokens/:tokenId')
  @HttpCode(202)
  async handle(
    @Param('campaignId', new ParseUUIDPipe()) campaignId: string,
    @Param('tokenId', new ParseUUIDPipe()) tokenId: string,
    @AuthUserId() userId: string,
  ): Promise<void> {
    await this.mapLevelFinder.checkGmOwnership(campaignId, userId);

    await this.commandBus.execute(
      new RemoveTokenCommand(campaignId, tokenId),
    );
  }
}
