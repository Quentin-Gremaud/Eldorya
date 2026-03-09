import { InvitationCreated } from './events/invitation-created.event.js';
import { InvitationAccepted } from './events/invitation-accepted.event.js';
import { InvitationRevoked } from './events/invitation-revoked.event.js';
import { InvitationExpiredException } from './exceptions/invitation-expired.exception.js';
import { InvitationAlreadyUsedException } from './exceptions/invitation-already-used.exception.js';
import { InvitationAlreadyRevokedException } from './exceptions/invitation-already-revoked.exception.js';
import { AlreadyCampaignMemberException } from './exceptions/already-campaign-member.exception.js';
import { MembershipChecker } from './membership-checker.js';

export type InvitationEvent =
  | InvitationCreated
  | InvitationAccepted
  | InvitationRevoked;
export type InvitationStatus = 'uninitialized' | 'active' | 'used' | 'revoked';

export class InvitationAggregate {
  private id: string = '';
  private tokenHash: string = '';
  private campaignId: string = '';
  private createdByUserId: string = '';
  private status: InvitationStatus = 'uninitialized';
  private expiresAt: Date | null = null;
  private usedByUserId: string | null = null;
  private revokedByUserId: string | null = null;
  private uncommittedEvents: InvitationEvent[] = [];

  create(
    id: string,
    tokenHash: string,
    campaignId: string,
    createdByUserId: string,
    expiresAt: Date | null,
  ): void {
    // M2: Guard against double creation
    if (this.status !== 'uninitialized') {
      throw new Error('Invitation aggregate has already been created.');
    }

    const event = new InvitationCreated(
      id,
      tokenHash,
      campaignId,
      createdByUserId,
      expiresAt ? expiresAt.toISOString() : null,
    );

    this.applyEvent(event);
    this.uncommittedEvents.push(event);
  }

  async accept(
    userId: string,
    acceptedAt: Date,
    membershipChecker: MembershipChecker,
  ): Promise<void> {
    // H8: Guard against uninitialized aggregate and any non-active status
    if (this.status !== 'active') {
      if (this.status === 'used') {
        throw InvitationAlreadyUsedException.create();
      }
      throw new Error(
        'Cannot accept invitation: aggregate is not in active state.',
      );
    }

    if (this.expiresAt && acceptedAt >= this.expiresAt) {
      throw InvitationExpiredException.create();
    }

    const isMember = await membershipChecker.isMember(this.campaignId, userId);
    if (isMember) {
      throw AlreadyCampaignMemberException.create();
    }

    const event = new InvitationAccepted(
      this.id,
      this.campaignId,
      userId,
      acceptedAt.toISOString(),
    );

    this.applyEvent(event);
    this.uncommittedEvents.push(event);
  }

  revoke(revokedByUserId: string, revokedAt: Date): void {
    if (this.status !== 'active') {
      if (this.status === 'revoked') {
        throw InvitationAlreadyRevokedException.forInvitation(this.id);
      }
      if (this.status === 'used') {
        throw InvitationAlreadyUsedException.create();
      }
      throw new Error(
        'Cannot revoke invitation: aggregate is not in active state.',
      );
    }

    const event = new InvitationRevoked(
      this.id,
      this.campaignId,
      revokedByUserId,
      revokedAt.toISOString(),
    );

    this.applyEvent(event);
    this.uncommittedEvents.push(event);
  }

  private applyEvent(event: InvitationEvent): void {
    if (event instanceof InvitationCreated) {
      this.id = event.invitationId;
      this.tokenHash = event.tokenHash;
      this.campaignId = event.campaignId;
      this.createdByUserId = event.createdByUserId;
      this.status = 'active';
      this.expiresAt = event.expiresAt ? new Date(event.expiresAt) : null;
    } else if (event instanceof InvitationAccepted) {
      this.status = 'used';
      this.usedByUserId = event.acceptedByUserId;
    } else if (event instanceof InvitationRevoked) {
      this.status = 'revoked';
      this.revokedByUserId = event.revokedByUserId;
    }
  }

  loadFromHistory(
    events: { type: string; data: Record<string, unknown> }[],
  ): void {
    for (const event of events) {
      if (event.type === 'InvitationCreated') {
        const d = event.data;
        this.applyEvent(
          new InvitationCreated(
            this.requireString(d, 'invitationId', event.type),
            this.requireString(d, 'tokenHash', event.type),
            this.requireString(d, 'campaignId', event.type),
            this.requireString(d, 'createdByUserId', event.type),
            this.optionalString(d, 'expiresAt', event.type),
          ),
        );
      } else if (event.type === 'InvitationAccepted') {
        const d = event.data;
        this.applyEvent(
          new InvitationAccepted(
            this.requireString(d, 'invitationId', event.type),
            this.requireString(d, 'campaignId', event.type),
            this.requireString(d, 'acceptedByUserId', event.type),
            this.requireString(d, 'acceptedAt', event.type),
          ),
        );
      } else if (event.type === 'InvitationRevoked') {
        const d = event.data;
        this.applyEvent(
          new InvitationRevoked(
            this.requireString(d, 'invitationId', event.type),
            this.requireString(d, 'campaignId', event.type),
            this.requireString(d, 'revokedByUserId', event.type),
            this.requireString(d, 'revokedAt', event.type),
          ),
        );
      } else {
        throw new Error(`Unknown event type: ${event.type}`);
      }
    }
  }

  getUncommittedEvents(): InvitationEvent[] {
    return [...this.uncommittedEvents];
  }

  clearEvents(): void {
    this.uncommittedEvents = [];
  }

  getId(): string {
    return this.id;
  }

  getCampaignId(): string {
    return this.campaignId;
  }

  getStatus(): InvitationStatus {
    return this.status;
  }

  private requireString(
    data: Record<string, unknown>,
    field: string,
    eventType: string,
  ): string {
    const value = data[field];
    if (typeof value !== 'string') {
      throw new Error(
        `Invalid event data: "${field}" must be a string in ${eventType}, got ${typeof value}`,
      );
    }
    return value;
  }

  private optionalString(
    data: Record<string, unknown>,
    field: string,
    eventType: string,
  ): string | null {
    const value = data[field];
    if (value === null || value === undefined) return null;
    if (typeof value !== 'string') {
      throw new Error(
        `Invalid event data: "${field}" must be a string or null in ${eventType}, got ${typeof value}`,
      );
    }
    return value;
  }
}
