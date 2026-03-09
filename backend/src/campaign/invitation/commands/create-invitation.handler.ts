import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateInvitationCommand } from './create-invitation.command.js';
import { InvitationAggregate } from '../invitation.aggregate.js';
import { InvitationCreated } from '../events/invitation-created.event.js';
import { KurrentDbService } from '../../../infrastructure/eventstore/kurrentdb.service.js';
import type { Clock } from '../../../shared/clock.js';
import { CLOCK } from '../../../shared/clock.js';

@CommandHandler(CreateInvitationCommand)
export class CreateInvitationHandler implements ICommandHandler<CreateInvitationCommand> {
  private readonly logger = new Logger(CreateInvitationHandler.name);

  constructor(
    private readonly kurrentDb: KurrentDbService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(command: CreateInvitationCommand): Promise<void> {
    const aggregate = new InvitationAggregate();
    aggregate.create(
      command.invitationId,
      command.tokenHash,
      command.campaignId,
      command.createdByUserId,
      command.expiresAt,
    );

    const streamName = `campaign-${command.campaignId}`;
    const events = aggregate.getUncommittedEvents();

    const correlationId = randomUUID();
    for (const event of events) {
      if (!(event instanceof InvitationCreated)) continue;

      await this.kurrentDb.appendToStream(
        streamName,
        'InvitationCreated',
        {
          invitationId: event.invitationId,
          tokenHash: event.tokenHash,
          campaignId: event.campaignId,
          createdByUserId: event.createdByUserId,
          expiresAt: event.expiresAt,
        },
        { correlationId, timestamp: this.clock.now().toISOString() },
      );
    }

    aggregate.clearEvents();

    this.logger.log(
      `InvitationCreated event persisted for invitation ${command.invitationId} in campaign ${command.campaignId}`,
    );
  }
}
