export interface ProposedChanges {
  [field: string]: {
    current: unknown;
    proposed: unknown;
  };
}

export class CharacterModificationRequested {
  readonly type = 'CharacterModificationRequested' as const;

  constructor(
    public readonly characterId: string,
    public readonly playerId: string,
    public readonly campaignId: string,
    public readonly characterName: string,
    public readonly proposedChanges: ProposedChanges,
    public readonly reason: string | null,
    public readonly requestedAt: string,
  ) {}
}
