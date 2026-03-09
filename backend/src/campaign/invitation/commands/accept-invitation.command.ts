export class AcceptInvitationCommand {
  constructor(
    public readonly invitationId: string,
    public readonly campaignId: string,
    public readonly acceptedByUserId: string,
  ) {}
}
