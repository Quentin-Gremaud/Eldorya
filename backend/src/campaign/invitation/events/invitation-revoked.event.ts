export class InvitationRevoked {
  readonly type = 'InvitationRevoked' as const;

  constructor(
    public readonly invitationId: string,
    public readonly campaignId: string,
    public readonly revokedByUserId: string,
    public readonly revokedAt: string,
  ) {}
}
