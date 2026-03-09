import type { ProposedChanges } from './character-modification-requested.event.js';

export class CharacterModificationApproved {
  readonly type = 'CharacterModificationApproved' as const;

  constructor(
    public readonly characterId: string,
    public readonly campaignId: string,
    public readonly approvedBy: string,
    public readonly characterName: string,
    public readonly appliedChanges: ProposedChanges,
    public readonly approvedAt: string,
  ) {}
}
