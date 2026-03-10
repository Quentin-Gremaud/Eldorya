export class FogStateInitialized {
  readonly type = 'FogStateInitialized' as const;

  constructor(
    public readonly campaignId: string,
    public readonly playerId: string,
    public readonly initializedAt: string,
  ) {}
}
