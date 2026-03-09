import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CreateInvitationHandler } from './commands/create-invitation.handler.js';
import { AcceptInvitationHandler } from './commands/accept-invitation.handler.js';
import { RevokeAnInvitationHandler } from './commands/revoke-an-invitation.handler.js';
import { InvitationAcceptedSideEffectsService } from './services/invitation-accepted-side-effects.service.js';
import { MembershipCheckerAdapter } from '../../infrastructure/campaign/membership-checker.adapter.js';
import { SystemClock, CLOCK } from '../../shared/clock.js';
import { MEMBERSHIP_CHECKER } from './invitation.constants.js';

@Module({
  imports: [CqrsModule],
  providers: [
    CreateInvitationHandler,
    AcceptInvitationHandler,
    RevokeAnInvitationHandler,
    InvitationAcceptedSideEffectsService,
    { provide: MEMBERSHIP_CHECKER, useClass: MembershipCheckerAdapter },
    { provide: CLOCK, useClass: SystemClock },
  ],
  exports: [MEMBERSHIP_CHECKER],
})
export class InvitationModule {}
