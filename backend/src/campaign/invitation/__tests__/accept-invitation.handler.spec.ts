import { AcceptInvitationHandler } from '../commands/accept-invitation.handler.js';
import { AcceptInvitationCommand } from '../commands/accept-invitation.command.js';
import { KurrentDbService } from '../../../infrastructure/eventstore/kurrentdb.service.js';
import { MembershipChecker } from '../membership-checker.js';
import { InvitationAcceptedSideEffectsService } from '../services/invitation-accepted-side-effects.service.js';
import { Clock } from '../../../shared/clock.js';

describe('AcceptInvitationHandler', () => {
  let handler: AcceptInvitationHandler;
  let kurrentDb: {
    readStream: ReturnType<typeof jest.fn>;
    appendToStream: ReturnType<typeof jest.fn>;
  };
  let membershipChecker: { isMember: ReturnType<typeof jest.fn> };
  let sideEffects: { execute: ReturnType<typeof jest.fn> };
  let mockClock: Clock;

  const fixedNow = new Date('2026-03-05T12:00:00Z');
  const invitationId = 'inv-123';
  const campaignId = 'campaign-456';
  const acceptedByUserId = 'user-player-1';

  beforeEach(() => {
    kurrentDb = {
      readStream: jest.fn().mockResolvedValue([
        {
          type: 'InvitationCreated',
          data: {
            invitationId,
            tokenHash: 'hash-abc',
            campaignId,
            createdByUserId: 'user-gm-1',
            expiresAt: new Date('2026-03-08T12:00:00Z').toISOString(),
          },
        },
      ]),
      appendToStream: jest.fn().mockResolvedValue(undefined),
    };

    membershipChecker = {
      isMember: jest.fn().mockResolvedValue(false),
    };

    sideEffects = {
      execute: jest.fn().mockResolvedValue(undefined),
    };

    mockClock = {
      now: jest.fn().mockReturnValue(fixedNow),
    };

    handler = new AcceptInvitationHandler(
      kurrentDb as unknown as KurrentDbService,
      membershipChecker as unknown as MembershipChecker,
      sideEffects as unknown as InvitationAcceptedSideEffectsService,
      mockClock,
    );
  });

  it('should load aggregate from event store, accept, and persist event', async () => {
    const command = new AcceptInvitationCommand(
      invitationId,
      campaignId,
      acceptedByUserId,
    );

    await handler.execute(command);

    expect(kurrentDb.readStream).toHaveBeenCalledWith(`campaign-${campaignId}`);
    expect(kurrentDb.appendToStream).toHaveBeenCalledTimes(1);

    const [streamName, eventType, eventData, metadata] =
      kurrentDb.appendToStream.mock.calls[0];

    expect(streamName).toBe(`campaign-${campaignId}`);
    expect(eventType).toBe('InvitationAccepted');
    expect(eventData.invitationId).toBe(invitationId);
    expect(eventData.campaignId).toBe(campaignId);
    expect(eventData.acceptedByUserId).toBe(acceptedByUserId);
    expect(eventData.acceptedAt).toBe(fixedNow.toISOString());
    expect(metadata.timestamp).toBe(fixedNow.toISOString());
  });

  it('should use the injected clock for acceptedAt and metadata timestamp', async () => {
    const command = new AcceptInvitationCommand(
      invitationId,
      campaignId,
      acceptedByUserId,
    );

    await handler.execute(command);

    expect(mockClock.now).toHaveBeenCalled();

    const [, , eventData, metadata] = kurrentDb.appendToStream.mock.calls[0];
    expect(eventData.acceptedAt).toBe('2026-03-05T12:00:00.000Z');
    expect(metadata.timestamp).toBe('2026-03-05T12:00:00.000Z');
  });

  it('should call membership checker during accept', async () => {
    const command = new AcceptInvitationCommand(
      invitationId,
      campaignId,
      acceptedByUserId,
    );

    await handler.execute(command);

    expect(membershipChecker.isMember).toHaveBeenCalledWith(
      campaignId,
      acceptedByUserId,
    );
  });

  it('should call side effects service after event persistence', async () => {
    const command = new AcceptInvitationCommand(
      invitationId,
      campaignId,
      acceptedByUserId,
    );

    await handler.execute(command);

    expect(sideEffects.execute).toHaveBeenCalledWith(
      campaignId,
      acceptedByUserId,
    );
    // Verify side effects called AFTER appendToStream
    const appendOrder = kurrentDb.appendToStream.mock.invocationCallOrder[0];
    const sideEffectsOrder = sideEffects.execute.mock.invocationCallOrder[0];
    expect(appendOrder).toBeLessThan(sideEffectsOrder);
  });

  it('should throw when invitation not found in event stream', async () => {
    kurrentDb.readStream.mockResolvedValue([]);

    const command = new AcceptInvitationCommand(
      'non-existent',
      campaignId,
      acceptedByUserId,
    );

    await expect(handler.execute(command)).rejects.toThrow(
      'Cannot accept invitation: aggregate is not in active state.',
    );
  });
});
