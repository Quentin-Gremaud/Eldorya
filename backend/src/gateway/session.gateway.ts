import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Server } from 'socket.io';
import { ClerkTokenVerifierService } from '../infrastructure/auth/clerk-token-verifier.service.js';
import { PrismaService } from '../infrastructure/database/prisma.service.js';
import { AuthenticatedSocket } from './types/authenticated-socket.js';
import { RoomManagerService } from './services/room-manager.service.js';
import { SessionFinder } from '../presentation/session/finders/session.finder.js';
import { PingPlayerCommand } from '../session/action-pipeline/commands/ping-player.command.js';
import { ProposeActionCommand } from '../session/action-pipeline/commands/propose-action.command.js';
import { ValidateActionCommand } from '../session/action-pipeline/commands/validate-action.command.js';
import { RejectActionCommand } from '../session/action-pipeline/commands/reject-action.command.js';

const ALLOWED_ACTION_TYPES = ['move', 'attack', 'interact', 'free-text'] as const;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_NARRATIVE_NOTE_LENGTH = 1000;
const MAX_FEEDBACK_LENGTH = 1000;

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class SessionGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(SessionGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly tokenVerifier: ClerkTokenVerifierService,
    private readonly roomManager: RoomManagerService,
    private readonly sessionFinder: SessionFinder,
    private readonly commandBus: CommandBus,
    private readonly prisma: PrismaService,
  ) {}

  private async isCampaignMember(campaignId: string, userId: string): Promise<boolean> {
    const member = await this.prisma.campaignMember.findFirst({
      where: { campaignId, userId },
    });
    return member !== null;
  }

  afterInit() {
    // Socket.io middleware uses next() callback, async is safe here
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    this.server.use(async (socket, next) => {
      const token = socket.handshake.auth?.token as string | undefined;

      if (!token) {
        return next(new Error('Authentication failed: missing token'));
      }

      try {
        const payload = await this.tokenVerifier.verify(token);
        (socket as AuthenticatedSocket).userId = payload.sub;
        (socket as AuthenticatedSocket).campaignId =
          socket.handshake.query?.campaignId as string | undefined;
        next();
      } catch {
        next(new Error('Authentication failed: invalid token'));
      }
    });

    this.logger.log('WebSocket Gateway initialized with JWT authentication');
  }

  handleConnection(client: AuthenticatedSocket) {
    this.logger.log(
      `Client connected: ${client.id} (userId: ${client.userId})`,
    );
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(
      `Client disconnected: ${client.id} (userId: ${client.userId})`,
    );
  }

  @SubscribeMessage('join-session')
  async handleJoinSession(
    client: AuthenticatedSocket,
    payload: { sessionId: string; campaignId: string },
  ): Promise<{ success: boolean; error?: string }> {
    const { sessionId, campaignId } = payload;

    if (!sessionId || typeof sessionId !== 'string') {
      return { success: false, error: 'Invalid sessionId' };
    }
    if (!campaignId || typeof campaignId !== 'string') {
      return { success: false, error: 'Invalid campaignId' };
    }

    const session = await this.sessionFinder.findActiveSessionByCampaign(campaignId);
    if (!session || session.id !== sessionId) {
      return { success: false, error: 'Session not found or not active' };
    }

    // GM can always join
    if (session.gmUserId === client.userId) {
      await this.roomManager.joinRoom(client, sessionId);
      return { success: true };
    }

    // C-4: Verify caller is a campaign member
    const isMember = await this.isCampaignMember(campaignId, client.userId);
    if (!isMember) {
      return { success: false, error: 'Not a campaign member' };
    }

    // Players can only join when session is live
    if (session.mode !== 'live') {
      return { success: false, error: 'Session is not in live mode' };
    }

    await this.roomManager.joinRoom(client, sessionId);
    return { success: true };
  }

  @SubscribeMessage('ping-player')
  async handlePingPlayer(
    client: AuthenticatedSocket,
    payload: { sessionId: string; campaignId: string; playerId: string },
  ): Promise<{ success: boolean; error?: string }> {
    const { sessionId, campaignId, playerId } = payload;

    if (!sessionId || typeof sessionId !== 'string') {
      return { success: false, error: 'Invalid sessionId' };
    }
    if (!campaignId || typeof campaignId !== 'string') {
      return { success: false, error: 'Invalid campaignId' };
    }
    if (!playerId || typeof playerId !== 'string') {
      return { success: false, error: 'Invalid playerId' };
    }

    const session = await this.sessionFinder.findById(sessionId);
    if (!session || session.campaignId !== campaignId) {
      return { success: false, error: 'Session not found' };
    }
    if (session.gmUserId !== client.userId) {
      return { success: false, error: 'Only the GM can ping players' };
    }
    if (session.mode !== 'live') {
      return { success: false, error: 'Session is not in live mode' };
    }

    try {
      await this.commandBus.execute(
        new PingPlayerCommand(sessionId, campaignId, client.userId, playerId),
      );
      return { success: true };
    } catch (err) {
      this.logger.error(`Failed to ping player: ${err instanceof Error ? err.message : String(err)}`);
      return { success: false, error: 'Failed to ping player' };
    }
  }

  @SubscribeMessage('propose-action')
  async handleProposeAction(
    client: AuthenticatedSocket,
    payload: {
      sessionId: string;
      campaignId: string;
      actionId: string;
      actionType: string;
      description: string;
      target?: string;
    },
  ): Promise<{ success: boolean; error?: string }> {
    const { sessionId, campaignId, actionId, actionType, description, target } = payload;

    if (!sessionId || typeof sessionId !== 'string') {
      return { success: false, error: 'Invalid sessionId' };
    }
    if (!campaignId || typeof campaignId !== 'string') {
      return { success: false, error: 'Invalid campaignId' };
    }
    if (!actionId || typeof actionId !== 'string') {
      return { success: false, error: 'Invalid actionId' };
    }
    if (!actionType || !ALLOWED_ACTION_TYPES.includes(actionType as (typeof ALLOWED_ACTION_TYPES)[number])) {
      return { success: false, error: 'Invalid actionType' };
    }
    if (!description || typeof description !== 'string' || description.length > MAX_DESCRIPTION_LENGTH) {
      return { success: false, error: 'Invalid description' };
    }

    const session = await this.sessionFinder.findById(sessionId);
    if (!session || session.campaignId !== campaignId) {
      return { success: false, error: 'Session not found' };
    }
    if (session.mode !== 'live') {
      return { success: false, error: 'Session is not in live mode' };
    }

    // C-3: Verify caller is a campaign member
    const isMember = await this.isCampaignMember(campaignId, client.userId);
    if (!isMember) {
      return { success: false, error: 'Not a campaign member' };
    }

    try {
      await this.commandBus.execute(
        new ProposeActionCommand(
          actionId,
          sessionId,
          campaignId,
          client.userId,
          actionType,
          description,
          target ?? null,
        ),
      );
      return { success: true };
    } catch (err) {
      this.logger.error(`Failed to propose action: ${err instanceof Error ? err.message : String(err)}`);
      return { success: false, error: 'Failed to propose action' };
    }
  }

  @SubscribeMessage('validate-action')
  async handleValidateAction(
    client: AuthenticatedSocket,
    payload: {
      sessionId: string;
      campaignId: string;
      actionId: string;
      narrativeNote?: string;
    },
  ): Promise<{ success: boolean; error?: string }> {
    const { sessionId, campaignId, actionId, narrativeNote } = payload;

    if (!sessionId || typeof sessionId !== 'string') {
      return { success: false, error: 'Invalid sessionId' };
    }
    if (!campaignId || typeof campaignId !== 'string') {
      return { success: false, error: 'Invalid campaignId' };
    }
    if (!actionId || typeof actionId !== 'string') {
      return { success: false, error: 'Invalid actionId' };
    }
    if (narrativeNote !== undefined && narrativeNote !== null) {
      if (typeof narrativeNote !== 'string' || narrativeNote.length > MAX_NARRATIVE_NOTE_LENGTH) {
        return { success: false, error: 'Invalid narrativeNote' };
      }
    }

    const session = await this.sessionFinder.findById(sessionId);
    if (!session || session.campaignId !== campaignId) {
      return { success: false, error: 'Session not found' };
    }
    if (session.gmUserId !== client.userId) {
      return { success: false, error: 'Only the GM can validate actions' };
    }
    if (session.mode !== 'live') {
      return { success: false, error: 'Session is not in live mode' };
    }

    try {
      await this.commandBus.execute(
        new ValidateActionCommand(
          actionId,
          sessionId,
          campaignId,
          client.userId,
          narrativeNote ?? null,
        ),
      );
      return { success: true };
    } catch (err) {
      this.logger.error(`Failed to validate action: ${err instanceof Error ? err.message : String(err)}`);
      return { success: false, error: 'Failed to validate action' };
    }
  }

  @SubscribeMessage('reject-action')
  async handleRejectAction(
    client: AuthenticatedSocket,
    payload: {
      sessionId: string;
      campaignId: string;
      actionId: string;
      feedback: string;
    },
  ): Promise<{ success: boolean; error?: string }> {
    const { sessionId, campaignId, actionId, feedback } = payload;

    if (!sessionId || typeof sessionId !== 'string') {
      return { success: false, error: 'Invalid sessionId' };
    }
    if (!campaignId || typeof campaignId !== 'string') {
      return { success: false, error: 'Invalid campaignId' };
    }
    if (!actionId || typeof actionId !== 'string') {
      return { success: false, error: 'Invalid actionId' };
    }
    if (!feedback || typeof feedback !== 'string' || feedback.trim().length === 0) {
      return { success: false, error: 'Feedback is required' };
    }
    if (feedback.length > MAX_FEEDBACK_LENGTH) {
      return { success: false, error: 'Feedback is too long' };
    }

    const session = await this.sessionFinder.findById(sessionId);
    if (!session || session.campaignId !== campaignId) {
      return { success: false, error: 'Session not found' };
    }
    if (session.gmUserId !== client.userId) {
      return { success: false, error: 'Only the GM can reject actions' };
    }
    if (session.mode !== 'live') {
      return { success: false, error: 'Session is not in live mode' };
    }

    try {
      await this.commandBus.execute(
        new RejectActionCommand(
          actionId,
          sessionId,
          campaignId,
          client.userId,
          feedback.trim(),
        ),
      );
      return { success: true };
    } catch (err) {
      this.logger.error(`Failed to reject action: ${err instanceof Error ? err.message : String(err)}`);
      return { success: false, error: 'Failed to reject action' };
    }
  }
}
