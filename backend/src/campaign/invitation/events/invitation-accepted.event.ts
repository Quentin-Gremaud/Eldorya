export class InvitationAccepted {
  readonly type = 'InvitationAccepted' as const;

  constructor(
    public readonly invitationId: string,
    public readonly campaignId: string,
    public readonly acceptedByUserId: string,
    public readonly acceptedAt: string,
  ) {}
}
