import { ActionType } from './action-type.js';
import { InvalidActionProposalException } from './exceptions/invalid-action-proposal.exception.js';

const MAX_DESCRIPTION_LENGTH = 500;

export class ActionProposal {
  private constructor(
    private readonly actionType: ActionType,
    private readonly description: string,
    private readonly target: string | null,
  ) {}

  static create(
    actionType: string,
    description: string,
    target?: string | null,
  ): ActionProposal {
    if (!description || !description.trim()) {
      throw InvalidActionProposalException.forReason('description cannot be empty');
    }
    if (description.length > MAX_DESCRIPTION_LENGTH) {
      throw InvalidActionProposalException.forReason(
        `description exceeds maximum length of ${MAX_DESCRIPTION_LENGTH} characters`,
      );
    }

    return new ActionProposal(
      ActionType.fromString(actionType),
      description.trim(),
      target?.trim() || null,
    );
  }

  getActionType(): ActionType {
    return this.actionType;
  }

  getDescription(): string {
    return this.description;
  }

  getTarget(): string | null {
    return this.target;
  }
}
