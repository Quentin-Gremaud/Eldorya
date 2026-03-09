import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RegisterAUserCommand } from './register-a-user.command.js';
import { UserAggregate } from '../user.aggregate.js';
import { UserRegistered } from '../events/user-registered.event.js';
import { Email } from '../email.js';
import { AgeDeclaration } from '../age-declaration.js';
import { KurrentDbService } from '../../eventstore/kurrentdb.service.js';
import { CryptoShreddingService } from '../../gdpr/crypto-shredding.service.js';

@CommandHandler(RegisterAUserCommand)
export class RegisterAUserHandler implements ICommandHandler<RegisterAUserCommand> {
  private readonly logger = new Logger(RegisterAUserHandler.name);

  constructor(
    private readonly kurrentDb: KurrentDbService,
    private readonly cryptoShredding: CryptoShreddingService,
  ) {}

  async execute(command: RegisterAUserCommand): Promise<void> {
    // Idempotency: skip if user already registered in event store
    try {
      const existingEvents = await this.kurrentDb.readStream(
        `user-${command.clerkUserId}`,
      );
      if (existingEvents.length > 0) {
        this.logger.warn(
          `User ${command.clerkUserId} already registered — skipping duplicate registration`,
        );
        return;
      }
    } catch {
      // Stream doesn't exist yet — proceed with registration
    }

    const aggregate = new UserAggregate();

    const email = Email.create(command.email);
    const ageDeclaration = AgeDeclaration.create(
      command.ageDeclaration,
      new Date(command.ageDeclarationTimestamp),
    );

    aggregate.register(
      command.clerkUserId,
      email,
      command.firstName,
      command.lastName,
      ageDeclaration,
      new Date(command.createdAt),
    );

    const events = aggregate.getUncommittedEvents();
    for (const event of events) {
      if (!(event instanceof UserRegistered)) {
        continue;
      }

      const key = await this.cryptoShredding.generateAndStoreKey(
        command.clerkUserId,
      );

      const encryptedData = {
        clerkUserId: event.clerkUserId,
        email: this.cryptoShredding.encrypt(event.email, key),
        firstName: this.cryptoShredding.encrypt(event.firstName, key),
        lastName: this.cryptoShredding.encrypt(event.lastName, key),
        ageDeclaration: event.ageDeclaration,
        ageDeclarationTimestamp: event.ageDeclarationTimestamp,
        registeredAt: event.registeredAt,
      };

      const correlationId = randomUUID();
      await this.kurrentDb.appendToStream(
        `user-${command.clerkUserId}`,
        'UserRegistered',
        encryptedData,
        { correlationId, timestamp: new Date().toISOString() },
      );

      this.logger.log(
        `UserRegistered event persisted for user ${command.clerkUserId}`,
      );
    }

    aggregate.clearEvents();
  }
}
