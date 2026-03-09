export class MaxCapacityModified {
  readonly type = 'MaxCapacityModified' as const;

  constructor(
    public readonly characterId: string,
    public readonly previousMaxCapacity: number,
    public readonly newMaxCapacity: number,
    public readonly modifiedBy: string,
    public readonly modifiedAt: string,
  ) {}
}
