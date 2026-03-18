import { PlayerPinged } from './events/player-pinged.event.js';
import { ActionProposed } from './events/action-proposed.event.js';
import { ActionValidated } from './events/action-validated.event.js';
import { ActionRejected } from './events/action-rejected.event.js';
import { ActionQueueReordered } from './events/action-queue-reordered.event.js';
import { ActionProposal } from './action-proposal.js';
import { SessionId } from '../../shared/session-id.js';
import { CampaignId } from '../../shared/campaign-id.js';
import { NotSessionGmException } from './exceptions/not-session-gm.exception.js';
import { InvalidActionProposalException } from './exceptions/invalid-action-proposal.exception.js';
import { ActionNotFoundException } from './exceptions/action-not-found.exception.js';
import { ActionNotPendingException } from './exceptions/action-not-pending.exception.js';
import { FeedbackRequiredException } from './exceptions/feedback-required.exception.js';
import { InvalidQueueReorderException } from './exceptions/invalid-queue-reorder.exception.js';
import type { Clock } from '../../shared/clock.js';

export type ActionPipelineEvent =
  | PlayerPinged
  | ActionProposed
  | ActionValidated
  | ActionRejected
  | ActionQueueReordered;

const MAX_NARRATIVE_NOTE_LENGTH = 1000;
const MAX_FEEDBACK_LENGTH = 1000;

export class ActionPipelineAggregate {
  private sessionId = '';
  private campaignId = '';
  private pingedPlayerIds: Set<string> = new Set();
  private pendingActionIds: string[] = [];
  private resolvedActionIds: Set<string> = new Set();
  private uncommittedEvents: ActionPipelineEvent[] = [];
  private _isNew = false;

  private constructor() {}

  static create(sessionId: string, campaignId: string): ActionPipelineAggregate {
    SessionId.fromString(sessionId);
    CampaignId.fromString(campaignId);

    const aggregate = new ActionPipelineAggregate();
    aggregate.sessionId = sessionId;
    aggregate.campaignId = campaignId;
    aggregate._isNew = true;
    return aggregate;
  }

  pingPlayer(
    playerId: string,
    gmUserId: string,
    callerUserId: string,
    clock: Clock,
  ): void {
    if (!playerId || !playerId.trim()) {
      throw new Error('Player ID cannot be empty');
    }
    if (!gmUserId || !gmUserId.trim()) {
      throw new Error('GM user ID cannot be empty');
    }
    if (callerUserId !== gmUserId) {
      throw NotSessionGmException.forUser(callerUserId);
    }

    const event = new PlayerPinged(
      this.sessionId,
      this.campaignId,
      playerId,
      gmUserId,
      clock.now().toISOString(),
    );

    this.applyEvent(event);
    this.uncommittedEvents.push(event);
  }

  proposeAction(
    actionId: string,
    playerId: string,
    actionType: string,
    description: string,
    target: string | null,
    clock: Clock,
  ): void {
    if (!actionId || !actionId.trim()) {
      throw new Error('Action ID cannot be empty');
    }
    if (!playerId || !playerId.trim()) {
      throw new Error('Player ID cannot be empty');
    }
    if (this.pendingActionIds.includes(actionId)) {
      throw InvalidActionProposalException.forReason(
        `action "${actionId}" has already been proposed`,
      );
    }

    const proposal = ActionProposal.create(actionType, description, target);

    const event = new ActionProposed(
      actionId,
      this.sessionId,
      this.campaignId,
      playerId,
      proposal.getActionType().toString(),
      proposal.getDescription(),
      proposal.getTarget(),
      clock.now().toISOString(),
    );

    this.applyEvent(event);
    this.uncommittedEvents.push(event);
  }

  validateAction(
    actionId: string,
    gmUserId: string,
    callerUserId: string,
    narrativeNote: string | null,
    clock: Clock,
  ): void {
    if (callerUserId !== gmUserId) {
      throw NotSessionGmException.forUser(callerUserId);
    }
    this.ensureActionIsPending(actionId);

    const trimmedNote = narrativeNote?.trim() || null;
    if (trimmedNote && trimmedNote.length > MAX_NARRATIVE_NOTE_LENGTH) {
      throw new Error(`Narrative note exceeds maximum length of ${MAX_NARRATIVE_NOTE_LENGTH} characters`);
    }

    const event = new ActionValidated(
      actionId,
      this.sessionId,
      this.campaignId,
      gmUserId,
      trimmedNote,
      clock.now().toISOString(),
    );

    this.applyEvent(event);
    this.uncommittedEvents.push(event);
  }

  rejectAction(
    actionId: string,
    gmUserId: string,
    callerUserId: string,
    feedback: string,
    clock: Clock,
  ): void {
    if (callerUserId !== gmUserId) {
      throw NotSessionGmException.forUser(callerUserId);
    }
    if (!feedback || !feedback.trim()) {
      throw FeedbackRequiredException.create();
    }
    const trimmedFeedback = feedback.trim();
    if (trimmedFeedback.length > MAX_FEEDBACK_LENGTH) {
      throw new Error(`Feedback exceeds maximum length of ${MAX_FEEDBACK_LENGTH} characters`);
    }
    this.ensureActionIsPending(actionId);

    const event = new ActionRejected(
      actionId,
      this.sessionId,
      this.campaignId,
      gmUserId,
      trimmedFeedback,
      clock.now().toISOString(),
    );

    this.applyEvent(event);
    this.uncommittedEvents.push(event);
  }

  reorderActionQueue(
    orderedActionIds: string[],
    gmUserId: string,
    callerUserId: string,
    clock: Clock,
  ): void {
    if (callerUserId !== gmUserId) {
      throw NotSessionGmException.forUser(callerUserId);
    }
    if (this.pendingActionIds.length === 0) {
      throw InvalidQueueReorderException.forEmptyQueue();
    }
    if (orderedActionIds.length !== this.pendingActionIds.length) {
      throw InvalidQueueReorderException.forMismatchedActionIds();
    }
    const currentSet = new Set(this.pendingActionIds);
    const providedSet = new Set(orderedActionIds);
    if (currentSet.size !== providedSet.size || ![...currentSet].every((id) => providedSet.has(id))) {
      throw InvalidQueueReorderException.forMismatchedActionIds();
    }

    const event = new ActionQueueReordered(
      this.sessionId,
      this.campaignId,
      orderedActionIds,
      gmUserId,
      clock.now().toISOString(),
    );

    this.applyEvent(event);
    this.uncommittedEvents.push(event);
  }

  private ensureActionIsPending(actionId: string): void {
    if (!this.pendingActionIds.includes(actionId) && !this.resolvedActionIds.has(actionId)) {
      throw ActionNotFoundException.forAction(actionId);
    }
    if (!this.pendingActionIds.includes(actionId)) {
      throw ActionNotPendingException.forAction(actionId);
    }
  }

  private applyEvent(event: ActionPipelineEvent): void {
    if (event instanceof PlayerPinged) {
      this.sessionId = event.sessionId;
      this.campaignId = event.campaignId;
      this.pingedPlayerIds.add(event.playerId);
    } else if (event instanceof ActionProposed) {
      this.sessionId = event.sessionId;
      this.campaignId = event.campaignId;
      this.pendingActionIds.push(event.actionId);
    } else if (event instanceof ActionValidated) {
      this.pendingActionIds = this.pendingActionIds.filter((id) => id !== event.actionId);
      this.resolvedActionIds.add(event.actionId);
    } else if (event instanceof ActionRejected) {
      this.pendingActionIds = this.pendingActionIds.filter((id) => id !== event.actionId);
      this.resolvedActionIds.add(event.actionId);
    } else if (event instanceof ActionQueueReordered) {
      this.pendingActionIds = [...event.orderedActionIds];
    } else {
      throw new Error(
        `Unexpected event type in applyEvent: ${(event as Record<string, unknown>).constructor?.name}`,
      );
    }
  }

  static loadFromHistory(
    sessionId: string,
    events: { type: string; data: Record<string, unknown> }[],
  ): ActionPipelineAggregate {
    const aggregate = new ActionPipelineAggregate();
    aggregate.sessionId = sessionId;

    for (const event of events) {
      if (event.type === 'PlayerPinged') {
        const d = event.data;
        aggregate.applyEvent(
          new PlayerPinged(
            aggregate.requireString(d, 'sessionId', event.type),
            aggregate.requireString(d, 'campaignId', event.type),
            aggregate.requireString(d, 'playerId', event.type),
            aggregate.requireString(d, 'gmUserId', event.type),
            aggregate.requireString(d, 'pingedAt', event.type),
          ),
        );
      } else if (event.type === 'ActionProposed') {
        const d = event.data;
        aggregate.applyEvent(
          new ActionProposed(
            aggregate.requireString(d, 'actionId', event.type),
            aggregate.requireString(d, 'sessionId', event.type),
            aggregate.requireString(d, 'campaignId', event.type),
            aggregate.requireString(d, 'playerId', event.type),
            aggregate.requireString(d, 'actionType', event.type),
            aggregate.requireString(d, 'description', event.type),
            (d.target as string) ?? null,
            aggregate.requireString(d, 'proposedAt', event.type),
          ),
        );
      } else if (event.type === 'ActionValidated') {
        const d = event.data;
        aggregate.applyEvent(
          new ActionValidated(
            aggregate.requireString(d, 'actionId', event.type),
            aggregate.requireString(d, 'sessionId', event.type),
            aggregate.requireString(d, 'campaignId', event.type),
            aggregate.requireString(d, 'gmUserId', event.type),
            (d.narrativeNote as string) ?? null,
            aggregate.requireString(d, 'validatedAt', event.type),
          ),
        );
      } else if (event.type === 'ActionRejected') {
        const d = event.data;
        aggregate.applyEvent(
          new ActionRejected(
            aggregate.requireString(d, 'actionId', event.type),
            aggregate.requireString(d, 'sessionId', event.type),
            aggregate.requireString(d, 'campaignId', event.type),
            aggregate.requireString(d, 'gmUserId', event.type),
            aggregate.requireString(d, 'feedback', event.type),
            aggregate.requireString(d, 'rejectedAt', event.type),
          ),
        );
      } else if (event.type === 'ActionQueueReordered') {
        const d = event.data;
        const orderedActionIds = d.orderedActionIds;
        if (!Array.isArray(orderedActionIds)) {
          throw new Error(
            `Invalid event data: "orderedActionIds" must be an array in ActionQueueReordered`,
          );
        }
        aggregate.applyEvent(
          new ActionQueueReordered(
            aggregate.requireString(d, 'sessionId', event.type),
            aggregate.requireString(d, 'campaignId', event.type),
            orderedActionIds as string[],
            aggregate.requireString(d, 'gmUserId', event.type),
            aggregate.requireString(d, 'reorderedAt', event.type),
          ),
        );
      } else {
        throw new Error(`Unknown event type: ${event.type}`);
      }
    }

    return aggregate;
  }

  isNew(): boolean {
    return this._isNew;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  getCampaignId(): string {
    return this.campaignId;
  }

  getPingedPlayerIds(): string[] {
    return [...this.pingedPlayerIds];
  }

  getPendingActionIds(): string[] {
    return [...this.pendingActionIds];
  }

  getUncommittedEvents(): ActionPipelineEvent[] {
    return [...this.uncommittedEvents];
  }

  clearEvents(): void {
    this.uncommittedEvents = [];
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
}
