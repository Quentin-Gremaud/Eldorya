import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RevokeAnInvitationCommand } from './revoke-an-invitation.command.js';
import { InvitationAggregate } from '../invitation.aggregate.js';
import { InvitationRevoked } from '../events/invitation-revoked.event.js';
import { KurrentDbService } from '../../../infrastructure/eventstore/kurrentdb.service.js';
import type { Clock } from '../../../shared/clock.js';
import { CLOCK } from '../../../shared/clock.js';

@CommandHandler(RevokeAnInvitationCommand)
export class RevokeAnInvitationHandler
  implements ICommandHandler<RevokeAnInvitationCommand>
{
  private readonly logger = new Logger(RevokeAnInvitationHandler.name);

  constructor(
    private readonly kurrentDb: KurrentDbService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(command: RevokeAnInvitationCommand): Promise<void> {
    const streamName = `campaign-${command.campaignId}`;
    const existingEvents = await this.kurrentDb.readStream(streamName);

    const invitationEvents = existingEvents.filter(
      (e) => e.data.invitationId === command.invitationId,
    );

    const aggregate = new InvitationAggregate();
    aggregate.loadFromHistory(invitationEvents);

    const now = this.clock.now();
    aggregate.revoke(command.revokedByUserId, now);

    const events = aggregate.getUncommittedEvents();
    const correlationId = randomUUID();

    for (const event of events) {
      if (!(event instanceof InvitationRevoked)) continue;

      await this.kurrentDb.appendToStream(
        streamName,
        'InvitationRevoked',
        {
          invitationId: event.invitationId,
          campaignId: event.campaignId,
          revokedByUserId: event.revokedByUserId,
          revokedAt: event.revokedAt,
        },
        { correlationId, timestamp: now.toISOString() },
      );
    }

    aggregate.clearEvents();

    this.logger.log(
      `InvitationRevoked event persisted for invitation ${command.invitationId}`,
    );
  }
}
