import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { START, eventTypeFilter } from '@kurrent/kurrentdb-client';
import { KurrentDbService } from '../../../infrastructure/eventstore/kurrentdb.service.js';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';

@Injectable()
export class InvitationProjection implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(InvitationProjection.name);
  private abortController: AbortController | null = null;

  constructor(
    private readonly kurrentDb: KurrentDbService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    void this.startSubscription();
  }

  onModuleDestroy() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  private async startSubscription() {
    this.abortController = new AbortController();

    try {
      const client = this.kurrentDb.getClient();

      const checkpoint = await this.prisma.projectionCheckpoint.findUnique({
        where: { projectionName: 'InvitationProjection' },
      });

      const fromPosition = checkpoint
        ? {
            commit: BigInt(checkpoint.commitPosition),
            prepare: BigInt(checkpoint.preparePosition),
          }
        : START;

      const subscription = client.subscribeToAll({
        fromPosition,
        filter: eventTypeFilter({
          prefixes: ['InvitationCreated', 'InvitationAccepted', 'InvitationRevoked'],
        }),
      });

      this.logger.log(
        `Invitation projection catch-up subscription started from ${checkpoint ? `position ${checkpoint.commitPosition}` : 'START'}`,
      );

      for await (const resolvedEvent of subscription) {
        if (this.abortController.signal.aborted) break;
        if (!resolvedEvent.event) continue;

        try {
          const eventType = resolvedEvent.event.type;
          const data = resolvedEvent.event.data as Record<string, unknown>;

          if (eventType === 'InvitationCreated') {
            await this.handleInvitationCreated(data);
          } else if (eventType === 'InvitationAccepted') {
            await this.handleInvitationAccepted(data);
          } else if (eventType === 'InvitationRevoked') {
            await this.handleInvitationRevoked(data);
          }

          // M11: Store both commitPosition and preparePosition from event position
          const position = resolvedEvent.event?.position;
          if (position) {
            await this.prisma.projectionCheckpoint.upsert({
              where: { projectionName: 'InvitationProjection' },
              create: {
                projectionName: 'InvitationProjection',
                commitPosition: String(position.commit),
                preparePosition: String(position.prepare),
              },
              update: {
                commitPosition: String(position.commit),
                preparePosition: String(position.prepare),
              },
            });
          }
        } catch (err) {
          this.logger.error(
            `Error projecting event ${resolvedEvent.event.id}`,
            err instanceof Error ? err.stack : String(err),
          );
        }
      }
    } catch (err) {
      if (this.abortController?.signal.aborted) return;
      this.logger.error(
        'Invitation projection subscription error — will retry in 5s',
        err instanceof Error ? err.stack : String(err),
      );
      // L8: Reconnect on transient failures after a delay
      setTimeout(() => {
        if (!this.abortController?.signal.aborted) {
          void this.startSubscription();
        }
      }, 5000);
    }
  }

  async handleInvitationCreated(data: Record<string, unknown>): Promise<void> {
    const invitationId = data.invitationId as string;
    const tokenHash = data.tokenHash as string;
    const campaignId = data.campaignId as string;
    const createdByUserId = data.createdByUserId as string;
    const expiresAt = data.expiresAt
      ? new Date(data.expiresAt as string)
      : null;

    await this.prisma.invitation.upsert({
      where: { id: invitationId },
      create: {
        id: invitationId,
        tokenHash,
        campaignId,
        createdByUserId,
        status: 'active',
        expiresAt,
      },
      update: {
        tokenHash,
        campaignId,
        createdByUserId,
        status: 'active',
        expiresAt,
      },
    });

    this.logger.log(`Invitation ${invitationId} projected to read model`);
  }

  async handleInvitationAccepted(data: Record<string, unknown>): Promise<void> {
    const invitationId = data.invitationId as string;
    const acceptedByUserId = data.acceptedByUserId as string;
    const acceptedAt = new Date(data.acceptedAt as string);

    await this.prisma.invitation.updateMany({
      where: { id: invitationId },
      data: {
        status: 'used',
        usedByUserId: acceptedByUserId,
        usedAt: acceptedAt,
      },
    });

    this.logger.log(`Invitation ${invitationId} marked as used in read model`);
  }

  async handleInvitationRevoked(data: Record<string, unknown>): Promise<void> {
    const invitationId = data.invitationId as string;
    const revokedByUserId = data.revokedByUserId as string;
    const revokedAt = data.revokedAt as string;

    await this.prisma.invitation.updateMany({
      where: { id: invitationId },
      data: {
        status: 'revoked',
      },
    });

    this.logger.log(
      `Invitation ${invitationId} revoked by user ${revokedByUserId} at ${revokedAt}`,
    );
  }
}
