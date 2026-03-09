import { CreateInvitationHandler } from '../commands/create-invitation.handler.js';
import { CreateInvitationCommand } from '../commands/create-invitation.command.js';
import { KurrentDbService } from '../../../infrastructure/eventstore/kurrentdb.service.js';
import { Clock } from '../../../shared/clock.js';

describe('CreateInvitationHandler', () => {
  let handler: CreateInvitationHandler;
  let kurrentDb: { appendToStream: ReturnType<typeof jest.fn> };
  let mockClock: Clock;

  const fixedNow = new Date('2026-03-05T12:00:00Z');
  const invitationId = 'inv-123';
  const tokenHash = 'pre-hashed-token-value';
  const campaignId = 'campaign-456';
  const createdByUserId = 'user-gm-1';
  const expiresAt = new Date('2026-03-08T12:00:00Z');

  beforeEach(() => {
    kurrentDb = {
      appendToStream: jest.fn().mockResolvedValue(undefined),
    };

    mockClock = {
      now: jest.fn().mockReturnValue(fixedNow),
    };

    handler = new CreateInvitationHandler(
      kurrentDb as unknown as KurrentDbService,
      mockClock,
    );
  });

  it('should persist InvitationCreated event with hashed token', async () => {
    const command = new CreateInvitationCommand(
      invitationId,
      tokenHash,
      campaignId,
      createdByUserId,
      expiresAt,
    );

    await handler.execute(command);

    expect(kurrentDb.appendToStream).toHaveBeenCalledTimes(1);

    const [streamName, eventType, eventData] =
      kurrentDb.appendToStream.mock.calls[0];

    expect(streamName).toBe(`campaign-${campaignId}`);
    expect(eventType).toBe('InvitationCreated');
    expect(eventData.invitationId).toBe(invitationId);
    expect(eventData.campaignId).toBe(campaignId);
    expect(eventData.createdByUserId).toBe(createdByUserId);
    expect(eventData.expiresAt).toBe(expiresAt.toISOString());

    // Token hash is passed pre-hashed from the controller
    expect(eventData.tokenHash).toBe(tokenHash);
  });

  it('should use the injected clock for metadata timestamp', async () => {
    const command = new CreateInvitationCommand(
      invitationId,
      tokenHash,
      campaignId,
      createdByUserId,
      expiresAt,
    );

    await handler.execute(command);

    expect(mockClock.now).toHaveBeenCalled();

    const [, , , metadata] = kurrentDb.appendToStream.mock.calls[0];
    expect(metadata.timestamp).toBe('2026-03-05T12:00:00.000Z');
  });

  it('should use campaign-{campaignId} as stream name', async () => {
    const command = new CreateInvitationCommand(
      invitationId,
      tokenHash,
      'my-campaign-id',
      createdByUserId,
      null,
    );

    await handler.execute(command);

    const [streamName] = kurrentDb.appendToStream.mock.calls[0];
    expect(streamName).toBe('campaign-my-campaign-id');
  });

  it('should handle null expiresAt', async () => {
    const command = new CreateInvitationCommand(
      invitationId,
      tokenHash,
      campaignId,
      createdByUserId,
      null,
    );

    await handler.execute(command);

    const [, , eventData] = kurrentDb.appendToStream.mock.calls[0];
    expect(eventData.expiresAt).toBeNull();
  });

  it('should use a consistent correlationId across all appended events', async () => {
    const command = new CreateInvitationCommand(
      invitationId,
      tokenHash,
      campaignId,
      createdByUserId,
      expiresAt,
    );

    await handler.execute(command);

    // All calls should share the same correlationId (generated once before the loop)
    const calls = kurrentDb.appendToStream.mock.calls;
    expect(calls.length).toBeGreaterThan(0);

    const firstCorrelationId = calls[0][3].correlationId;
    expect(firstCorrelationId).toBeDefined();
    expect(typeof firstCorrelationId).toBe('string');

    for (const call of calls) {
      expect(call[3].correlationId).toBe(firstCorrelationId);
    }
  });
});
