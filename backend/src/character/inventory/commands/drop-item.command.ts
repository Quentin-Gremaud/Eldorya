export class DropItemCommand {
  constructor(
    public readonly characterId: string,
    public readonly itemId: string,
    public readonly userId: string,
  ) {}
}
