export class UserRegistered {
  constructor(
    public readonly clerkUserId: string,
    public readonly email: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly ageDeclaration: boolean,
    public readonly ageDeclarationTimestamp: string,
    public readonly registeredAt: string,
  ) {}
}
