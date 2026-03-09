import { Controller, Post, Param, BadRequestException } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { AuthUserId } from '../../../infrastructure/auth/auth-user-id.decorator.js';
import { InvitationFinder } from '../finders/invitation.finder.js';
import { InvitationToken } from '../../../campaign/invitation/invitation-token.js';
import { InvitationNotFoundException } from '../../../campaign/invitation/exceptions/invitation-not-found.exception.js';
import { AcceptInvitationCommand } from '../../../campaign/invitation/commands/accept-invitation.command.js';

@Controller('invitations')
export class AcceptInvitationController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly invitationFinder: InvitationFinder,
  ) {}

  @Post(':token/accept')
  async handle(
    @Param('token') token: string,
    @AuthUserId() userId: string,
  ): Promise<{ data: { campaignId: string } }> {
    const invitationToken = InvitationToken.fromRawToken(token);
    const tokenHash = invitationToken.hash();

    // H2: Use findActiveByTokenHash to reject used/revoked invitations
    const invitation =
      await this.invitationFinder.findActiveByTokenHash(tokenHash);

    if (!invitation) {
      throw InvitationNotFoundException.notFound();
    }

    // H2: Check expiry at presentation layer
    if (invitation.expiresAt && new Date() > invitation.expiresAt) {
      throw new BadRequestException('This invitation has expired.');
    }

    // H4: Pass campaignId in command to avoid read-model dependency in handler
    await this.commandBus.execute(
      new AcceptInvitationCommand(invitation.id, invitation.campaignId, userId),
    );

    return { data: { campaignId: invitation.campaignId } };
  }
}
