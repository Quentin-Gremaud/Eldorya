import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RequestAccountDeletionCommand } from './request-account-deletion.command.js';
import { UserAggregate } from '../user.aggregate.js';
import { AccountDeletionRequested } from '../events/account-deletion-requested.event.js';
import { KurrentDbService } from '../../eventstore/kurrentdb.service.js';
import { AccountDeletionService } from '../services/account-deletion.service.js';

@CommandHandler(RequestAccountDeletionCommand)
export class RequestAccountDeletionHandler implements ICommandHandler<RequestAccountDeletionCommand> {
  private readonly logger = new Logger(RequestAccountDeletionHandler.name);

  constructor(
    private readonly kurrentDb: KurrentDbService,
    private readonly accountDeletionService: AccountDeletionService,
  ) {}

  async execute(command: RequestAccountDeletionCommand): Promise<void> {
    const streamName = `user-${command.clerkUserId}`;

    let existingEvents: { type: string; data: Record<string, unknown> }[] = [];
    try {
      existingEvents = await this.kurrentDb.readStream(streamName);
    } catch {
      this.logger.warn(
        `No event stream found for user ${command.clerkUserId}, proceeding with deletion`,
      );
    }

    const aggregate = new UserAggregate();
    aggregate.loadFromHistory(existingEvents);

    // Idempotent: if already deleted, skip
    if (aggregate.isDeleted()) {
      this.logger.warn(
        `User ${command.clerkUserId} already deleted — skipping duplicate deletion`,
      );
      return;
    }

    const requestedAt = new Date();

    if (aggregate.isRegistered()) {
      // Registered user: go through aggregate
      aggregate.requestDeletion(command.clerkUserId, requestedAt);

      const events = aggregate.getUncommittedEvents();
      for (const event of events) {
        if (!(event instanceof AccountDeletionRequested)) continue;

        const correlationId = randomUUID();
        await this.kurrentDb.appendToStream(
          streamName,
          'AccountDeletionRequested',
          {
            clerkUserId: event.clerkUserId,
            requestedAt: event.requestedAt,
          },
          { correlationId, timestamp: requestedAt.toISOString() },
        );
      }

      aggregate.clearEvents();
    } else {
      // User exists in Clerk but not in event store — persist event directly
      const correlationId = randomUUID();
      await this.kurrentDb.appendToStream(
        streamName,
        'AccountDeletionRequested',
        {
          clerkUserId: command.clerkUserId,
          requestedAt: requestedAt.toISOString(),
        },
        { correlationId, timestamp: requestedAt.toISOString() },
      );
    }

    this.logger.log(
      `AccountDeletionRequested event persisted for user ${command.clerkUserId}`,
    );

    // Execute side effects after event persistence (GDPR priority)
    await this.accountDeletionService.executePostDeletionSideEffects(
      command.clerkUserId,
    );
  }
}
