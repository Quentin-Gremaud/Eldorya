export class InvitationCreated {
  readonly type = 'InvitationCreated' as const;

  constructor(
    public readonly invitationId: string,
    public readonly tokenHash: string,
    public readonly campaignId: string,
    public readonly createdByUserId: string,
    public readonly expiresAt: string | null,
  ) {}
}
