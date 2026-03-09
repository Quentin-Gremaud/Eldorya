export class RevokeAnInvitationCommand {
  constructor(
    public readonly invitationId: string,
    public readonly campaignId: string,
    public readonly revokedByUserId: string,
  ) {}
}
