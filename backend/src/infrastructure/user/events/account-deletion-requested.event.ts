export class AccountDeletionRequested {
  constructor(
    public readonly clerkUserId: string,
    public readonly requestedAt: string,
  ) {}
}
