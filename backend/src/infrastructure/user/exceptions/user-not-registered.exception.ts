import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class UserNotRegisteredException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static withClerkUserId(clerkUserId: string): UserNotRegisteredException {
    return new UserNotRegisteredException(
      `User with Clerk ID "${clerkUserId}" is not registered.`,
    );
  }
}
