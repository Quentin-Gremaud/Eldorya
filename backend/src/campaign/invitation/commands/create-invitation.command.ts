export class CreateInvitationCommand {
  constructor(
    public readonly invitationId: string,
    public readonly tokenHash: string,
    public readonly campaignId: string,
    public readonly createdByUserId: string,
    public readonly expiresAt: Date | null,
  ) {}
}
