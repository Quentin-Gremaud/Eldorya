import { InvitationAggregate } from '../invitation.aggregate.js';
import { InvitationCreated } from '../events/invitation-created.event.js';
import { InvitationAccepted } from '../events/invitation-accepted.event.js';
import { InvitationRevoked } from '../events/invitation-revoked.event.js';
import { InvitationExpiredException } from '../exceptions/invitation-expired.exception.js';
import { InvitationAlreadyUsedException } from '../exceptions/invitation-already-used.exception.js';
import { InvitationAlreadyRevokedException } from '../exceptions/invitation-already-revoked.exception.js';
import { AlreadyCampaignMemberException } from '../exceptions/already-campaign-member.exception.js';
import { MembershipChecker } from '../membership-checker.js';

describe('InvitationAggregate', () => {
  const invitationId = 'inv-123';
  const tokenHash = 'abc123hash';
  const campaignId = 'campaign-456';
  const createdByUserId = 'user-gm-1';
  const acceptingUserId = 'user-player-1';
  const now = new Date('2026-03-01T12:00:00Z');
  const futureExpiry = new Date('2026-03-08T12:00:00Z');
  const pastExpiry = new Date('2026-02-28T12:00:00Z');

  const mockMembershipChecker: MembershipChecker = {
    isMember: jest.fn().mockResolvedValue(false),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create()', () => {
    it('should emit InvitationCreated with correct data', () => {
      const aggregate = new InvitationAggregate();

      aggregate.create(
        invitationId,
        tokenHash,
        campaignId,
        createdByUserId,
        futureExpiry,
      );

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(InvitationCreated);

      const event = events[0] as InvitationCreated;
      expect(event.invitationId).toBe(invitationId);
      expect(event.tokenHash).toBe(tokenHash);
      expect(event.campaignId).toBe(campaignId);
      expect(event.createdByUserId).toBe(createdByUserId);
      expect(event.expiresAt).toBe(futureExpiry.toISOString());
    });

    it('should handle null expiresAt', () => {
      const aggregate = new InvitationAggregate();

      aggregate.create(
        invitationId,
        tokenHash,
        campaignId,
        createdByUserId,
        null,
      );

      const events = aggregate.getUncommittedEvents();
      const event = events[0] as InvitationCreated;
      expect(event.expiresAt).toBeNull();
    });

    it('should throw error on double creation', () => {
      const aggregate = new InvitationAggregate();
      aggregate.create(
        invitationId,
        tokenHash,
        campaignId,
        createdByUserId,
        futureExpiry,
      );

      expect(() =>
        aggregate.create(
          'inv-999',
          tokenHash,
          campaignId,
          createdByUserId,
          futureExpiry,
        ),
      ).toThrow('Invitation aggregate has already been created.');
    });
  });

  describe('accept()', () => {
    it('should emit InvitationAccepted when valid', async () => {
      const aggregate = new InvitationAggregate();
      aggregate.create(
        invitationId,
        tokenHash,
        campaignId,
        createdByUserId,
        futureExpiry,
      );
      aggregate.clearEvents();

      await aggregate.accept(acceptingUserId, now, mockMembershipChecker);

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(InvitationAccepted);

      const event = events[0] as InvitationAccepted;
      expect(event.invitationId).toBe(invitationId);
      expect(event.campaignId).toBe(campaignId);
      expect(event.acceptedByUserId).toBe(acceptingUserId);
      expect(event.acceptedAt).toBe(now.toISOString());
    });

    it('should throw InvitationExpiredException when expired', async () => {
      const aggregate = new InvitationAggregate();
      aggregate.create(
        invitationId,
        tokenHash,
        campaignId,
        createdByUserId,
        pastExpiry,
      );
      aggregate.clearEvents();

      await expect(
        aggregate.accept(acceptingUserId, now, mockMembershipChecker),
      ).rejects.toThrow(InvitationExpiredException);
    });

    it('should throw InvitationExpiredException with correct message when expired', async () => {
      const aggregate = new InvitationAggregate();
      aggregate.create(
        invitationId,
        tokenHash,
        campaignId,
        createdByUserId,
        pastExpiry,
      );
      aggregate.clearEvents();

      await expect(
        aggregate.accept(acceptingUserId, now, mockMembershipChecker),
      ).rejects.toThrow('This invitation has expired.');
    });

    it('should throw InvitationExpiredException when acceptedAt equals expiresAt (boundary)', async () => {
      const exactExpiry = new Date('2026-03-01T12:00:00Z');
      const acceptedAtSameTime = new Date('2026-03-01T12:00:00Z');

      const aggregate = new InvitationAggregate();
      aggregate.create(
        invitationId,
        tokenHash,
        campaignId,
        createdByUserId,
        exactExpiry,
      );
      aggregate.clearEvents();

      await expect(
        aggregate.accept(
          acceptingUserId,
          acceptedAtSameTime,
          mockMembershipChecker,
        ),
      ).rejects.toThrow(InvitationExpiredException);
    });

    it('should throw InvitationAlreadyUsedException when status is used', async () => {
      const aggregate = new InvitationAggregate();
      aggregate.create(
        invitationId,
        tokenHash,
        campaignId,
        createdByUserId,
        futureExpiry,
      );
      await aggregate.accept(acceptingUserId, now, mockMembershipChecker);
      aggregate.clearEvents();

      await expect(
        aggregate.accept('another-user', now, mockMembershipChecker),
      ).rejects.toThrow(InvitationAlreadyUsedException);
    });

    it('should throw InvitationAlreadyUsedException with correct message', async () => {
      const aggregate = new InvitationAggregate();
      aggregate.create(
        invitationId,
        tokenHash,
        campaignId,
        createdByUserId,
        futureExpiry,
      );
      await aggregate.accept(acceptingUserId, now, mockMembershipChecker);
      aggregate.clearEvents();

      await expect(
        aggregate.accept('another-user', now, mockMembershipChecker),
      ).rejects.toThrow('This invitation has already been used.');
    });

    it('should throw AlreadyCampaignMemberException when user is already member', async () => {
      const aggregate = new InvitationAggregate();
      aggregate.create(
        invitationId,
        tokenHash,
        campaignId,
        createdByUserId,
        futureExpiry,
      );
      aggregate.clearEvents();

      const memberChecker: MembershipChecker = {
        isMember: jest.fn().mockResolvedValue(true),
      };

      await expect(
        aggregate.accept(acceptingUserId, now, memberChecker),
      ).rejects.toThrow(AlreadyCampaignMemberException);
    });

    it('should throw AlreadyCampaignMemberException with correct message', async () => {
      const aggregate = new InvitationAggregate();
      aggregate.create(
        invitationId,
        tokenHash,
        campaignId,
        createdByUserId,
        futureExpiry,
      );
      aggregate.clearEvents();

      const memberChecker: MembershipChecker = {
        isMember: jest.fn().mockResolvedValue(true),
      };

      await expect(
        aggregate.accept(acceptingUserId, now, memberChecker),
      ).rejects.toThrow('You are already a member of this campaign.');
    });

    it('should accept invitation with no expiry date', async () => {
      const aggregate = new InvitationAggregate();
      aggregate.create(
        invitationId,
        tokenHash,
        campaignId,
        createdByUserId,
        null,
      );
      aggregate.clearEvents();

      await aggregate.accept(acceptingUserId, now, mockMembershipChecker);

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(InvitationAccepted);
    });
  });

  describe('revoke()', () => {
    const revokingUserId = 'user-gm-1';

    it('should emit InvitationRevoked when invitation is active', () => {
      const aggregate = new InvitationAggregate();
      aggregate.create(
        invitationId,
        tokenHash,
        campaignId,
        createdByUserId,
        futureExpiry,
      );
      aggregate.clearEvents();

      aggregate.revoke(revokingUserId, now);

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(InvitationRevoked);

      const event = events[0] as InvitationRevoked;
      expect(event.invitationId).toBe(invitationId);
      expect(event.campaignId).toBe(campaignId);
      expect(event.revokedByUserId).toBe(revokingUserId);
      expect(event.revokedAt).toBe(now.toISOString());
    });

    it('should transition status to revoked', () => {
      const aggregate = new InvitationAggregate();
      aggregate.create(
        invitationId,
        tokenHash,
        campaignId,
        createdByUserId,
        futureExpiry,
      );

      aggregate.revoke(revokingUserId, now);

      expect(aggregate.getStatus()).toBe('revoked');
    });

    it('should throw InvitationAlreadyRevokedException when already revoked', () => {
      const aggregate = new InvitationAggregate();
      aggregate.create(
        invitationId,
        tokenHash,
        campaignId,
        createdByUserId,
        futureExpiry,
      );
      aggregate.revoke(revokingUserId, now);
      aggregate.clearEvents();

      expect(() => aggregate.revoke(revokingUserId, now)).toThrow(
        InvitationAlreadyRevokedException,
      );
    });

    it('should throw InvitationAlreadyUsedException when invitation is used', async () => {
      const aggregate = new InvitationAggregate();
      aggregate.create(
        invitationId,
        tokenHash,
        campaignId,
        createdByUserId,
        futureExpiry,
      );
      await aggregate.accept(acceptingUserId, now, mockMembershipChecker);
      aggregate.clearEvents();

      expect(() => aggregate.revoke(revokingUserId, now)).toThrow(
        InvitationAlreadyUsedException,
      );
    });

    it('should throw error when aggregate is uninitialized', () => {
      const aggregate = new InvitationAggregate();

      expect(() => aggregate.revoke(revokingUserId, now)).toThrow(
        'Cannot revoke invitation: aggregate is not in active state.',
      );
    });
  });

  describe('loadFromHistory()', () => {
    it('should correctly reconstruct state from InvitationCreated event', () => {
      const aggregate = new InvitationAggregate();

      aggregate.loadFromHistory([
        {
          type: 'InvitationCreated',
          data: {
            invitationId,
            tokenHash,
            campaignId,
            createdByUserId,
            expiresAt: futureExpiry.toISOString(),
          },
        },
      ]);

      expect(aggregate.getId()).toBe(invitationId);
      expect(aggregate.getCampaignId()).toBe(campaignId);
      expect(aggregate.getStatus()).toBe('active');
      expect(aggregate.getUncommittedEvents()).toHaveLength(0);
    });

    it('should correctly reconstruct state with InvitationAccepted', () => {
      const aggregate = new InvitationAggregate();

      aggregate.loadFromHistory([
        {
          type: 'InvitationCreated',
          data: {
            invitationId,
            tokenHash,
            campaignId,
            createdByUserId,
            expiresAt: futureExpiry.toISOString(),
          },
        },
        {
          type: 'InvitationAccepted',
          data: {
            invitationId,
            campaignId,
            acceptedByUserId: acceptingUserId,
            acceptedAt: now.toISOString(),
          },
        },
      ]);

      expect(aggregate.getStatus()).toBe('used');
      expect(aggregate.getUncommittedEvents()).toHaveLength(0);
    });

    it('should throw error on unknown event type', () => {
      const aggregate = new InvitationAggregate();

      expect(() =>
        aggregate.loadFromHistory([
          {
            type: 'SomeUnknownEvent',
            data: { foo: 'bar' },
          },
        ]),
      ).toThrow('Unknown event type: SomeUnknownEvent');
    });

    it('should throw runtime validation error when required field is not a string', () => {
      const aggregate = new InvitationAggregate();

      expect(() =>
        aggregate.loadFromHistory([
          {
            type: 'InvitationCreated',
            data: {
              invitationId: 123,
              tokenHash,
              campaignId,
              createdByUserId,
              expiresAt: futureExpiry.toISOString(),
            },
          },
        ]),
      ).toThrow(
        'Invalid event data: "invitationId" must be a string in InvitationCreated, got number',
      );
    });

    it('should throw runtime validation error when required field is undefined', () => {
      const aggregate = new InvitationAggregate();

      expect(() =>
        aggregate.loadFromHistory([
          {
            type: 'InvitationCreated',
            data: {
              tokenHash,
              campaignId,
              createdByUserId,
              expiresAt: futureExpiry.toISOString(),
            },
          },
        ]),
      ).toThrow(
        'Invalid event data: "invitationId" must be a string in InvitationCreated, got undefined',
      );
    });

    it('should correctly reconstruct state with InvitationRevoked', () => {
      const aggregate = new InvitationAggregate();

      aggregate.loadFromHistory([
        {
          type: 'InvitationCreated',
          data: {
            invitationId,
            tokenHash,
            campaignId,
            createdByUserId,
            expiresAt: futureExpiry.toISOString(),
          },
        },
        {
          type: 'InvitationRevoked',
          data: {
            invitationId,
            campaignId,
            revokedByUserId: createdByUserId,
            revokedAt: now.toISOString(),
          },
        },
      ]);

      expect(aggregate.getStatus()).toBe('revoked');
      expect(aggregate.getUncommittedEvents()).toHaveLength(0);
    });

    it('should throw runtime validation error for InvitationRevoked with invalid data', () => {
      const aggregate = new InvitationAggregate();

      aggregate.loadFromHistory([
        {
          type: 'InvitationCreated',
          data: {
            invitationId,
            tokenHash,
            campaignId,
            createdByUserId,
            expiresAt: futureExpiry.toISOString(),
          },
        },
      ]);

      expect(() =>
        aggregate.loadFromHistory([
          {
            type: 'InvitationRevoked',
            data: {
              invitationId,
              campaignId,
              revokedByUserId: 42,
              revokedAt: now.toISOString(),
            },
          },
        ]),
      ).toThrow(
        'Invalid event data: "revokedByUserId" must be a string in InvitationRevoked, got number',
      );
    });

    it('should throw runtime validation error for InvitationAccepted with invalid data', () => {
      const aggregate = new InvitationAggregate();

      aggregate.loadFromHistory([
        {
          type: 'InvitationCreated',
          data: {
            invitationId,
            tokenHash,
            campaignId,
            createdByUserId,
            expiresAt: futureExpiry.toISOString(),
          },
        },
      ]);

      expect(() =>
        aggregate.loadFromHistory([
          {
            type: 'InvitationAccepted',
            data: {
              invitationId,
              campaignId,
              acceptedByUserId: 42,
              acceptedAt: now.toISOString(),
            },
          },
        ]),
      ).toThrow(
        'Invalid event data: "acceptedByUserId" must be a string in InvitationAccepted, got number',
      );
    });
  });
});
