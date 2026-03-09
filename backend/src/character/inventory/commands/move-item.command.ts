export class MoveItemCommand {
  constructor(
    public readonly characterId: string,
    public readonly itemId: string,
    public readonly toPosition: number,
    public readonly userId: string,
  ) {}
}
