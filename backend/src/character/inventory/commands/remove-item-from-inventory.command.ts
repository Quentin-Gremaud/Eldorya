export class RemoveItemFromInventoryCommand {
  constructor(
    public readonly characterId: string,
    public readonly itemId: string,
    public readonly userId: string,
  ) {}
}
