import { UserAggregate } from '../user.aggregate';
import { Email } from '../email';
import { AgeDeclaration } from '../age-declaration';
import { UserAlreadyRegisteredException } from '../exceptions/user-already-registered.exception';
import { UserNotRegisteredException } from '../exceptions/user-not-registered.exception';
import { AccountDeletionRequested } from '../events/account-deletion-requested.event';

describe('UserAggregate', () => {
  const validClerkUserId = 'clerk_user_123';
  const validEmail = Email.create('test@example.com');
  const validAgeDeclaration = AgeDeclaration.create(
    true,
    new Date('2026-01-01'),
  );
  const validDate = new Date('2026-01-01');

  it('should emit UserRegistered event on registration', () => {
    const aggregate = new UserAggregate();

    aggregate.register(
      validClerkUserId,
      validEmail,
      'John',
      'Doe',
      validAgeDeclaration,
      validDate,
    );

    const events = aggregate.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0].clerkUserId).toBe(validClerkUserId);
    expect(events[0].email).toBe('test@example.com');
    expect(events[0].firstName).toBe('John');
    expect(events[0].lastName).toBe('Doe');
    expect(events[0].ageDeclaration).toBe(true);
    expect(events[0].registeredAt).toBe(validDate.toISOString());
  });

  it('should throw UserAlreadyRegisteredException when registering twice', () => {
    const aggregate = new UserAggregate();

    aggregate.register(
      validClerkUserId,
      validEmail,
      'John',
      'Doe',
      validAgeDeclaration,
      validDate,
    );

    expect(() =>
      aggregate.register(
        validClerkUserId,
        validEmail,
        'John',
        'Doe',
        validAgeDeclaration,
        validDate,
      ),
    ).toThrow(UserAlreadyRegisteredException);
  });

  it('should mark aggregate as registered after registration', () => {
    const aggregate = new UserAggregate();
    expect(aggregate.isRegistered()).toBe(false);

    aggregate.register(
      validClerkUserId,
      validEmail,
      'John',
      'Doe',
      validAgeDeclaration,
      validDate,
    );

    expect(aggregate.isRegistered()).toBe(true);
  });

  it('should sanitize firstName and lastName (strip HTML tags)', () => {
    const aggregate = new UserAggregate();

    aggregate.register(
      validClerkUserId,
      validEmail,
      '<script>alert("xss")</script>John',
      'Doe<img src=x>',
      validAgeDeclaration,
      validDate,
    );

    const events = aggregate.getUncommittedEvents();
    expect(events[0].firstName).toBe('scriptalert("xss")/scriptJohn');
    expect(events[0].lastName).toBe('Doeimg src=x');
    expect(events[0].firstName).not.toContain('<');
    expect(events[0].lastName).not.toContain('<');
  });

  it('should preserve ampersands in names (no HTML encoding)', () => {
    const aggregate = new UserAggregate();

    aggregate.register(
      validClerkUserId,
      validEmail,
      'Johnson & Sons',
      "O'Brien",
      validAgeDeclaration,
      validDate,
    );

    const events = aggregate.getUncommittedEvents();
    expect(events[0].firstName).toBe('Johnson & Sons');
    expect(events[0].firstName).not.toContain('&amp;');
  });

  it('should clear events after clearEvents()', () => {
    const aggregate = new UserAggregate();
    aggregate.register(
      validClerkUserId,
      validEmail,
      'John',
      'Doe',
      validAgeDeclaration,
      validDate,
    );

    expect(aggregate.getUncommittedEvents()).toHaveLength(1);
    aggregate.clearEvents();
    expect(aggregate.getUncommittedEvents()).toHaveLength(0);
  });
});

describe('Email Value Object', () => {
  it('should create valid email', () => {
    const email = Email.create('user@example.com');
    expect(email.toString()).toBe('user@example.com');
  });

  it('should normalize email to lowercase', () => {
    const email = Email.create('User@Example.COM');
    expect(email.toString()).toBe('user@example.com');
  });

  it('should throw DomainException for invalid email', () => {
    expect(() => Email.create('not-an-email')).toThrow();
  });

  it('should throw DomainException for empty email', () => {
    expect(() => Email.create('')).toThrow();
  });
});

describe('UserAggregate — requestDeletion', () => {
  const validClerkUserId = 'clerk_user_456';
  const validEmail = Email.create('delete@example.com');
  const validAgeDeclaration = AgeDeclaration.create(
    true,
    new Date('2026-01-01'),
  );
  const validDate = new Date('2026-01-01');
  const deletionDate = new Date('2026-03-04');

  it('should emit AccountDeletionRequested event when registered user requests deletion', () => {
    const aggregate = new UserAggregate();
    aggregate.register(
      validClerkUserId,
      validEmail,
      'Jane',
      'Doe',
      validAgeDeclaration,
      validDate,
    );
    aggregate.clearEvents();

    aggregate.requestDeletion(validClerkUserId, deletionDate);

    const events = aggregate.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(AccountDeletionRequested);
    const deletionEvent = events[0] as AccountDeletionRequested;
    expect(deletionEvent.clerkUserId).toBe(validClerkUserId);
    expect(deletionEvent.requestedAt).toBe(deletionDate.toISOString());
  });

  it('should throw UserNotRegisteredException when user is not registered', () => {
    const aggregate = new UserAggregate();

    expect(() =>
      aggregate.requestDeletion(validClerkUserId, deletionDate),
    ).toThrow(UserNotRegisteredException);
  });

  it('should contain correct clerkUserId and requestedAt in emitted event', () => {
    const aggregate = new UserAggregate();
    aggregate.register(
      validClerkUserId,
      validEmail,
      'Jane',
      'Doe',
      validAgeDeclaration,
      validDate,
    );
    aggregate.clearEvents();

    const specificDate = new Date('2026-03-04T14:30:00.000Z');
    aggregate.requestDeletion(validClerkUserId, specificDate);

    const events = aggregate.getUncommittedEvents();
    const deletionEvent = events[0] as AccountDeletionRequested;
    expect(deletionEvent.clerkUserId).toBe(validClerkUserId);
    expect(deletionEvent.requestedAt).toBe('2026-03-04T14:30:00.000Z');
  });
});

describe('UserAggregate — deletion state tracking', () => {
  const validClerkUserId = 'clerk_user_789';
  const validEmail = Email.create('state@example.com');
  const validAgeDeclaration = AgeDeclaration.create(
    true,
    new Date('2026-01-01'),
  );
  const validDate = new Date('2026-01-01');
  const deletionDate = new Date('2026-03-05');

  it('should track deleted state via isDeleted()', () => {
    const aggregate = new UserAggregate();
    expect(aggregate.isDeleted()).toBe(false);

    aggregate.register(
      validClerkUserId,
      validEmail,
      'Alice',
      'Smith',
      validAgeDeclaration,
      validDate,
    );
    aggregate.clearEvents();

    aggregate.requestDeletion(validClerkUserId, deletionDate);
    expect(aggregate.isDeleted()).toBe(true);
  });

  it('should be idempotent — no event emitted when already deleted', () => {
    const aggregate = new UserAggregate();
    aggregate.register(
      validClerkUserId,
      validEmail,
      'Alice',
      'Smith',
      validAgeDeclaration,
      validDate,
    );
    aggregate.clearEvents();

    aggregate.requestDeletion(validClerkUserId, deletionDate);
    expect(aggregate.getUncommittedEvents()).toHaveLength(1);

    aggregate.clearEvents();

    // Second deletion: should silently skip
    aggregate.requestDeletion(validClerkUserId, new Date('2026-03-06'));
    expect(aggregate.getUncommittedEvents()).toHaveLength(0);
  });

  it('should reconstruct deleted state from history', () => {
    const aggregate = new UserAggregate();
    aggregate.loadFromHistory([
      {
        type: 'UserRegistered',
        data: {
          clerkUserId: validClerkUserId,
          email: 'test@example.com',
          firstName: 'Alice',
          lastName: 'Smith',
          ageDeclaration: true,
          ageDeclarationTimestamp: '2026-01-01T00:00:00.000Z',
          registeredAt: '2026-01-01T00:00:00.000Z',
        },
      },
      {
        type: 'AccountDeletionRequested',
        data: {
          clerkUserId: validClerkUserId,
          requestedAt: '2026-03-05T00:00:00.000Z',
        },
      },
    ]);

    expect(aggregate.isRegistered()).toBe(true);
    expect(aggregate.isDeleted()).toBe(true);
  });

  it('should not emit event after loadFromHistory with deletion', () => {
    const aggregate = new UserAggregate();
    aggregate.loadFromHistory([
      {
        type: 'UserRegistered',
        data: {
          clerkUserId: validClerkUserId,
          email: 'test@example.com',
          firstName: 'Alice',
          lastName: 'Smith',
          ageDeclaration: true,
          ageDeclarationTimestamp: '2026-01-01T00:00:00.000Z',
          registeredAt: '2026-01-01T00:00:00.000Z',
        },
      },
      {
        type: 'AccountDeletionRequested',
        data: {
          clerkUserId: validClerkUserId,
          requestedAt: '2026-03-05T00:00:00.000Z',
        },
      },
    ]);

    // Attempt deletion again — should be idempotent
    aggregate.requestDeletion(validClerkUserId, new Date('2026-03-06'));
    expect(aggregate.getUncommittedEvents()).toHaveLength(0);
  });
});

describe('AgeDeclaration Value Object', () => {
  it('should create valid age declaration', () => {
    const declaration = AgeDeclaration.create(true, new Date());
    expect(declaration.isDeclared()).toBe(true);
  });

  it('should throw when age not declared', () => {
    expect(() => AgeDeclaration.create(false, new Date())).toThrow(
      'Age declaration is required',
    );
  });
});
