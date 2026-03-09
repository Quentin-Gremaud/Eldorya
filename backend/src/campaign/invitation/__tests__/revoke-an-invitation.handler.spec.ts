import { RevokeAnInvitationHandler } from '../commands/revoke-an-invitation.handler.js';
import { RevokeAnInvitationCommand } from '../commands/revoke-an-invitation.command.js';
import { KurrentDbService } from '../../../infrastructure/eventstore/kurrentdb.service.js';
import { Clock } from '../../../shared/clock.js';

describe('RevokeAnInvitationHandler', () => {
  let handler: RevokeAnInvitationHandler;
  let kurrentDb: {
    readStream: ReturnType<typeof jest.fn>;
    appendToStream: ReturnType<typeof jest.fn>;
  };
  let mockClock: Clock;

  const fixedNow = new Date('2026-03-05T12:00:00Z');
  const invitationId = 'inv-123';
  const campaignId = 'campaign-456';
  const revokedByUserId = 'user-gm-1';

  beforeEach(() => {
    kurrentDb = {
      readStream: jest.fn().mockResolvedValue([
        {
          type: 'InvitationCreated',
          data: {
            invitationId,
            tokenHash: 'hash-abc',
            campaignId,
            createdByUserId: revokedByUserId,
            expiresAt: new Date('2026-03-08T12:00:00Z').toISOString(),
          },
        },
      ]),
      appendToStream: jest.fn().mockResolvedValue(undefined),
    };

    mockClock = {
      now: jest.fn().mockReturnValue(fixedNow),
    };

    handler = new RevokeAnInvitationHandler(
      kurrentDb as unknown as KurrentDbService,
      mockClock,
    );
  });

  it('should load aggregate from event store, revoke, and persist event', async () => {
    const command = new RevokeAnInvitationCommand(
      invitationId,
      campaignId,
      revokedByUserId,
    );

    await handler.execute(command);

    expect(kurrentDb.readStream).toHaveBeenCalledWith(`campaign-${campaignId}`);
    expect(kurrentDb.appendToStream).toHaveBeenCalledTimes(1);

    const [streamName, eventType, eventData, metadata] =
      kurrentDb.appendToStream.mock.calls[0];

    expect(streamName).toBe(`campaign-${campaignId}`);
    expect(eventType).toBe('InvitationRevoked');
    expect(eventData.invitationId).toBe(invitationId);
    expect(eventData.campaignId).toBe(campaignId);
    expect(eventData.revokedByUserId).toBe(revokedByUserId);
    expect(eventData.revokedAt).toBe(fixedNow.toISOString());
    expect(metadata.timestamp).toBe(fixedNow.toISOString());
  });

  it('should use the injected clock for revokedAt and metadata timestamp', async () => {
    const command = new RevokeAnInvitationCommand(
      invitationId,
      campaignId,
      revokedByUserId,
    );

    await handler.execute(command);

    expect(mockClock.now).toHaveBeenCalled();

    const [, , eventData, metadata] = kurrentDb.appendToStream.mock.calls[0];
    expect(eventData.revokedAt).toBe('2026-03-05T12:00:00.000Z');
    expect(metadata.timestamp).toBe('2026-03-05T12:00:00.000Z');
  });

  it('should contain zero business logic — only orchestration', async () => {
    const command = new RevokeAnInvitationCommand(
      invitationId,
      campaignId,
      revokedByUserId,
    );

    await handler.execute(command);

    // Handler only reads stream, loads aggregate, calls revoke, persists event
    expect(kurrentDb.readStream).toHaveBeenCalledTimes(1);
    expect(kurrentDb.appendToStream).toHaveBeenCalledTimes(1);
  });

  it('should throw when invitation not found in event stream', async () => {
    kurrentDb.readStream.mockResolvedValue([]);

    const command = new RevokeAnInvitationCommand(
      'non-existent',
      campaignId,
      revokedByUserId,
    );

    await expect(handler.execute(command)).rejects.toThrow(
      'Cannot revoke invitation: aggregate is not in active state.',
    );
  });
});
