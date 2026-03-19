import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { START, eventTypeFilter } from '@kurrent/kurrentdb-client';
import { KurrentDbService } from '../infrastructure/eventstore/kurrentdb.service.js';
import { PrismaService } from '../infrastructure/database/prisma.service.js';
import { SessionGateway } from './session.gateway.js';
import { RoomManagerService } from './services/room-manager.service.js';

@Injectable()
export class ActionEventSubscriber implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ActionEventSubscriber.name);
  private abortController: AbortController | null = null;

  constructor(
    private readonly kurrentDb: KurrentDbService,
    private readonly prisma: PrismaService,
    private readonly sessionGateway: SessionGateway,
    private readonly roomManager: RoomManagerService,
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
        where: { projectionName: 'ActionEventSubscriber' },
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
          prefixes: ['PlayerPinged', 'ActionProposed', 'ActionValidated', 'ActionRejected', 'ActionQueueReordered', 'ActionCancelled'],
        }),
      });

      this.logger.log(
        `Action event subscription started from ${checkpoint ? `position ${checkpoint.commitPosition}` : 'START'}`,
      );

      for await (const resolvedEvent of subscription) {
        if (this.abortController.signal.aborted) break;
        if (!resolvedEvent.event) continue;

        try {
          const eventType = resolvedEvent.event.type;
          const data = resolvedEvent.event.data as Record<string, unknown>;
          const metadata = resolvedEvent.event.metadata as Record<string, unknown> | undefined;

          if (eventType === 'PlayerPinged') {
            await this.handlePlayerPinged(data, metadata);
          } else if (eventType === 'ActionProposed') {
            await this.handleActionProposed(data, metadata);
          } else if (eventType === 'ActionValidated') {
            await this.handleActionValidated(data, metadata);
          } else if (eventType === 'ActionRejected') {
            await this.handleActionRejected(data, metadata);
          } else if (eventType === 'ActionQueueReordered') {
            await this.handleActionQueueReordered(data, metadata);
          } else if (eventType === 'ActionCancelled') {
            await this.handleActionCancelled(data, metadata);
          }

          const position = resolvedEvent.event?.position;
          if (position) {
            await this.prisma.projectionCheckpoint.upsert({
              where: { projectionName: 'ActionEventSubscriber' },
              create: {
                projectionName: 'ActionEventSubscriber',
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
            `Error processing action event ${resolvedEvent.event.id}`,
            err instanceof Error ? err.stack : String(err),
          );
        }
      }
    } catch (err) {
      if (this.abortController?.signal.aborted) return;
      this.logger.error(
        'Action event subscription error — will retry in 5s',
        err instanceof Error ? err.stack : String(err),
      );
      setTimeout(() => {
        if (!this.abortController?.signal.aborted) {
          void this.startSubscription();
        }
      }, 5000);
    }
  }

  private async handlePlayerPinged(
    data: Record<string, unknown>,
    metadata: Record<string, unknown> | undefined,
  ): Promise<void> {
    const sessionId = data.sessionId as string;
    const campaignId = data.campaignId as string;
    const playerId = data.playerId as string;

    const server = this.sessionGateway.server;
    if (!server) return;

    // Look up GM userId from session read model (consistent with handleActionProposed)
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      select: { gmUserId: true },
    });
    if (!session) return;
    const gmUserId = session.gmUserId;

    // Emit to the pinged player
    const playerSockets = await this.roomManager.findSocketsByUserId(server, sessionId, playerId);
    const payload = {
      type: 'PlayerPinged',
      data: { sessionId, campaignId, playerId },
      metadata: { campaignId, timestamp: metadata?.timestamp },
    };
    for (const socket of playerSockets) {
      socket.emit('PlayerPinged', payload);
    }

    // Emit confirmation to GM
    const gmSockets = await this.roomManager.findSocketsByUserId(server, sessionId, gmUserId);
    const gmPayload = {
      type: 'PlayerPingedGm',
      data: { sessionId, campaignId, playerId },
      metadata: { campaignId, timestamp: metadata?.timestamp },
    };
    for (const socket of gmSockets) {
      socket.emit('PlayerPingedGm', gmPayload);
    }

    this.logger.log(
      `Emitted PlayerPinged to player ${playerId} and GM ${gmUserId} in session ${sessionId}`,
    );
  }

  private async handleActionProposed(
    data: Record<string, unknown>,
    metadata: Record<string, unknown> | undefined,
  ): Promise<void> {
    const sessionId = data.sessionId as string;
    const campaignId = data.campaignId as string;
    const playerId = data.playerId as string;

    const server = this.sessionGateway.server;
    if (!server) return;

    // Find GM userId from session read model
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      select: { gmUserId: true },
    });
    if (!session) return;

    // Emit to GM
    const gmSockets = await this.roomManager.findSocketsByUserId(server, sessionId, session.gmUserId);
    const gmPayload = {
      type: 'ActionProposed',
      data: {
        actionId: data.actionId,
        sessionId,
        campaignId,
        playerId,
        actionType: data.actionType,
        description: data.description,
        target: data.target,
        proposedAt: data.proposedAt,
      },
      metadata: { campaignId, timestamp: metadata?.timestamp },
    };
    for (const socket of gmSockets) {
      socket.emit('ActionProposed', gmPayload);
    }

    // Emit confirmation to proposing player
    const playerSockets = await this.roomManager.findSocketsByUserId(server, sessionId, playerId);
    const playerPayload = {
      type: 'ActionProposedConfirmation',
      data: {
        actionId: data.actionId,
        sessionId,
        campaignId,
      },
      metadata: { campaignId, timestamp: metadata?.timestamp },
    };
    for (const socket of playerSockets) {
      socket.emit('ActionProposedConfirmation', playerPayload);
    }

    this.logger.log(
      `Emitted ActionProposed to GM and confirmation to player ${playerId} in session ${sessionId}`,
    );
  }

  private async handleActionValidated(
    data: Record<string, unknown>,
    metadata: Record<string, unknown> | undefined,
  ): Promise<void> {
    const actionId = data.actionId as string;
    const sessionId = data.sessionId as string;
    const campaignId = data.campaignId as string;
    const gmUserId = data.gmUserId as string;

    const server = this.sessionGateway.server;
    if (!server) return;

    // Look up proposing player from read model
    const action = await this.prisma.sessionAction.findUnique({
      where: { id: actionId },
      select: { playerId: true },
    });
    if (!action) return;

    const payload = {
      type: 'ActionValidated',
      data: {
        actionId,
        sessionId,
        campaignId,
        narrativeNote: data.narrativeNote ?? null,
        validatedAt: data.validatedAt,
      },
      metadata: { campaignId, timestamp: metadata?.timestamp },
    };

    // Emit to proposing player
    const playerSockets = await this.roomManager.findSocketsByUserId(server, sessionId, action.playerId);
    for (const socket of playerSockets) {
      socket.emit('ActionValidated', payload);
    }

    // Emit confirmation to GM
    const gmSockets = await this.roomManager.findSocketsByUserId(server, sessionId, gmUserId);
    for (const socket of gmSockets) {
      socket.emit('ActionValidated', payload);
    }

    this.logger.log(
      `Emitted ActionValidated for action ${actionId} to player ${action.playerId} and GM in session ${sessionId}`,
    );
  }

  private async handleActionRejected(
    data: Record<string, unknown>,
    metadata: Record<string, unknown> | undefined,
  ): Promise<void> {
    const actionId = data.actionId as string;
    const sessionId = data.sessionId as string;
    const campaignId = data.campaignId as string;
    const gmUserId = data.gmUserId as string;

    const server = this.sessionGateway.server;
    if (!server) return;

    // Look up proposing player from read model
    const action = await this.prisma.sessionAction.findUnique({
      where: { id: actionId },
      select: { playerId: true },
    });
    if (!action) return;

    const payload = {
      type: 'ActionRejected',
      data: {
        actionId,
        sessionId,
        campaignId,
        feedback: data.feedback,
        rejectedAt: data.rejectedAt,
      },
      metadata: { campaignId, timestamp: metadata?.timestamp },
    };

    // Emit to proposing player
    const playerSockets = await this.roomManager.findSocketsByUserId(server, sessionId, action.playerId);
    for (const socket of playerSockets) {
      socket.emit('ActionRejected', payload);
    }

    // Emit confirmation to GM
    const gmSockets = await this.roomManager.findSocketsByUserId(server, sessionId, gmUserId);
    for (const socket of gmSockets) {
      socket.emit('ActionRejected', payload);
    }

    this.logger.log(
      `Emitted ActionRejected for action ${actionId} to player ${action.playerId} and GM in session ${sessionId}`,
    );
  }

  private async handleActionCancelled(
    data: Record<string, unknown>,
    metadata: Record<string, unknown> | undefined,
  ): Promise<void> {
    const actionId = data.actionId as string;
    const sessionId = data.sessionId as string;
    const campaignId = data.campaignId as string;
    const playerId = data.playerId as string;

    const server = this.sessionGateway.server;
    if (!server) return;

    // Find GM userId from session read model
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      select: { gmUserId: true },
    });
    if (!session) return;

    // Emit to GM (action removed from queue)
    const gmSockets = await this.roomManager.findSocketsByUserId(server, sessionId, session.gmUserId);
    const gmPayload = {
      type: 'ActionCancelled',
      data: {
        actionId,
        sessionId,
        campaignId,
        playerId,
        cancelledAt: data.cancelledAt,
      },
      metadata: { campaignId, timestamp: metadata?.timestamp },
    };
    for (const socket of gmSockets) {
      socket.emit('ActionCancelled', gmPayload);
    }

    // Emit confirmation to cancelling player
    const playerSockets = await this.roomManager.findSocketsByUserId(server, sessionId, playerId);
    const playerPayload = {
      type: 'ActionCancelledConfirmation',
      data: {
        actionId,
        sessionId,
        campaignId,
      },
      metadata: { campaignId, timestamp: metadata?.timestamp },
    };
    for (const socket of playerSockets) {
      socket.emit('ActionCancelledConfirmation', playerPayload);
    }

    this.logger.log(
      `Emitted ActionCancelled to GM and confirmation to player ${playerId} in session ${sessionId}`,
    );
  }

  private async handleActionQueueReordered(
    data: Record<string, unknown>,
    metadata: Record<string, unknown> | undefined,
  ): Promise<void> {
    const sessionId = data.sessionId as string;
    const campaignId = data.campaignId as string;
    const gmUserId = data.gmUserId as string;

    const server = this.sessionGateway.server;
    if (!server) return;

    const payload = {
      type: 'ActionQueueReordered',
      data: {
        sessionId,
        campaignId,
        orderedActionIds: data.orderedActionIds,
      },
      metadata: { campaignId, timestamp: metadata?.timestamp },
    };

    // Emit to GM only — players don't see queue order
    const gmSockets = await this.roomManager.findSocketsByUserId(server, sessionId, gmUserId);
    for (const socket of gmSockets) {
      socket.emit('ActionQueueReordered', payload);
    }

    this.logger.log(
      `Emitted ActionQueueReordered to GM ${gmUserId} in session ${sessionId}`,
    );
  }
}
