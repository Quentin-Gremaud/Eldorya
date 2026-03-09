import { Controller, Get, Param } from '@nestjs/common';
import { Public } from '../../../infrastructure/auth/public.decorator.js';
import { InvitationFinder } from '../finders/invitation.finder.js';
import { InvitationToken } from '../../../campaign/invitation/invitation-token.js';

@Controller('invitations')
export class ValidateInvitationController {
  constructor(private readonly invitationFinder: InvitationFinder) {}

  @Public()
  @Get(':token/validate')
  async handle(@Param('token') token: string): Promise<{
    data: {
      valid: boolean;
      campaignId?: string;
      campaignName?: string;
      expired?: boolean;
    };
  }> {
    const invitationToken = InvitationToken.fromRawToken(token);
    const tokenHash = invitationToken.hash();

    const invitation =
      await this.invitationFinder.findActiveByTokenHash(tokenHash);

    if (!invitation) {
      return { data: { valid: false } };
    }

    // Check expiry
    if (invitation.expiresAt && new Date() > invitation.expiresAt) {
      return { data: { valid: false, expired: true } };
    }

    return {
      data: {
        valid: true,
        campaignId: invitation.campaignId,
        campaignName: invitation.campaignName,
      },
    };
  }
}
