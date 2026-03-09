import { Email } from './email.js';
import { AgeDeclaration } from './age-declaration.js';
import { UserAlreadyRegisteredException } from './exceptions/user-already-registered.exception.js';
import { UserNotRegisteredException } from './exceptions/user-not-registered.exception.js';
import { UserRegistered } from './events/user-registered.event.js';
import { AccountDeletionRequested } from './events/account-deletion-requested.event.js';

export type UserEvent = UserRegistered | AccountDeletionRequested;

export class UserAggregate {
  private registered = false;
  private deleted = false;
  private clerkUserId: string = '';
  private events: UserEvent[] = [];

  register(
    clerkUserId: string,
    email: Email,
    firstName: string,
    lastName: string,
    ageDeclaration: AgeDeclaration,
    registeredAt: Date,
  ): void {
    if (this.registered) {
      throw UserAlreadyRegisteredException.withClerkUserId(clerkUserId);
    }

    const event = new UserRegistered(
      clerkUserId,
      email.toString(),
      this.sanitize(firstName),
      this.sanitize(lastName),
      ageDeclaration.isDeclared(),
      ageDeclaration.getTimestamp().toISOString(),
      registeredAt.toISOString(),
    );

    this.applyEvent(event);
    this.events.push(event);
  }

  requestDeletion(clerkUserId: string, requestedAt: Date): void {
    if (this.deleted) {
      return; // Idempotent: already deleted
    }
    if (!this.registered) {
      throw UserNotRegisteredException.withClerkUserId(clerkUserId);
    }

    const event = new AccountDeletionRequested(
      clerkUserId,
      requestedAt.toISOString(),
    );

    this.applyEvent(event);
    this.events.push(event);
  }

  private sanitize(input: string): string {
    return input.replace(/[<>]/g, '').trim();
  }

  private applyEvent(event: UserEvent): void {
    if (event instanceof UserRegistered) {
      this.registered = true;
      this.clerkUserId = event.clerkUserId;
    } else if (event instanceof AccountDeletionRequested) {
      this.deleted = true;
    }
  }

  loadFromHistory(
    events: { type: string; data: Record<string, unknown> }[],
  ): void {
    for (const event of events) {
      if (event.type === 'UserRegistered') {
        this.applyEvent(
          new UserRegistered(
            event.data.clerkUserId as string,
            event.data.email as string,
            event.data.firstName as string,
            event.data.lastName as string,
            event.data.ageDeclaration as boolean,
            event.data.ageDeclarationTimestamp as string,
            event.data.registeredAt as string,
          ),
        );
      } else if (event.type === 'AccountDeletionRequested') {
        this.applyEvent(
          new AccountDeletionRequested(
            event.data.clerkUserId as string,
            event.data.requestedAt as string,
          ),
        );
      }
    }
  }

  getUncommittedEvents(): UserEvent[] {
    return [...this.events];
  }

  clearEvents(): void {
    this.events = [];
  }

  isDeleted(): boolean {
    return this.deleted;
  }

  isRegistered(): boolean {
    return this.registered;
  }
}
