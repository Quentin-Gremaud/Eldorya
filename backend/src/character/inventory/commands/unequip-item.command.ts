export class UnequipItemCommand {
  constructor(
    public readonly characterId: string,
    public readonly itemId: string,
    public readonly userId: string,
  ) {}
}
