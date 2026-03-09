import type { ProposedChanges } from '../events/character-modification-requested.event.js';

export class RequestCharacterModificationCommand {
  constructor(
    public readonly characterId: string,
    public readonly playerId: string,
    public readonly campaignId: string,
    public readonly proposedChanges: ProposedChanges,
    public readonly reason: string | null,
  ) {}
}
