export class ModifyMaxCapacityCommand {
  constructor(
    public readonly characterId: string,
    public readonly newMaxCapacity: number,
    public readonly userId: string,
  ) {}
}
