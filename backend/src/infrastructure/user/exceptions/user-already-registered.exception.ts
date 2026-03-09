import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class UserAlreadyRegisteredException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static withClerkUserId(clerkUserId: string): UserAlreadyRegisteredException {
    return new UserAlreadyRegisteredException(
      `User with Clerk ID "${clerkUserId}" is already registered.`,
    );
  }
}
