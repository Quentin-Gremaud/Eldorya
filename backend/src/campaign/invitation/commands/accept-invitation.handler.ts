import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AcceptInvitationCommand } from './accept-invitation.command.js';
import { InvitationAggregate } from '../invitation.aggregate.js';
import { InvitationAccepted } from '../events/invitation-accepted.event.js';
import { KurrentDbService } from '../../../infrastructure/eventstore/kurrentdb.service.js';
import { InvitationAcceptedSideEffectsService } from '../services/invitation-accepted-side-effects.service.js';
import type { MembershipChecker } from '../membership-checker.js';
import { MEMBERSHIP_CHECKER } from '../invitation.constants.js';
import type { Clock } from '../../../shared/clock.js';
import { CLOCK } from '../../../shared/clock.js';

@CommandHandler(AcceptInvitationCommand)
export class AcceptInvitationHandler implements ICommandHandler<AcceptInvitationCommand> {
  private readonly logger = new Logger(AcceptInvitationHandler.name);

  constructor(
    private readonly kurrentDb: KurrentDbService,
    @Inject(MEMBERSHIP_CHECKER)
    private readonly membershipChecker: MembershipChecker,
    private readonly sideEffects: InvitationAcceptedSideEffectsService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(command: AcceptInvitationCommand): Promise<void> {
    const streamName = `campaign-${command.campaignId}`;
    const existingEvents = await this.kurrentDb.readStream(streamName);

    const invitationEvents = existingEvents.filter(
      (e) => e.data.invitationId === command.invitationId,
    );

    const aggregate = new InvitationAggregate();
    aggregate.loadFromHistory(invitationEvents);

    const now = this.clock.now();
    await aggregate.accept(
      command.acceptedByUserId,
      now,
      this.membershipChecker,
    );

    const events = aggregate.getUncommittedEvents();
    const correlationId = randomUUID();

    for (const event of events) {
      if (!(event instanceof InvitationAccepted)) continue;

      await this.kurrentDb.appendToStream(
        streamName,
        'InvitationAccepted',
        {
          invitationId: event.invitationId,
          campaignId: event.campaignId,
          acceptedByUserId: event.acceptedByUserId,
          acceptedAt: event.acceptedAt,
        },
        { correlationId, timestamp: now.toISOString() },
      );
    }

    aggregate.clearEvents();

    this.logger.log(
      `InvitationAccepted event persisted for invitation ${command.invitationId}`,
    );

    await this.sideEffects.execute(
      command.campaignId,
      command.acceptedByUserId,
    );
  }
}
