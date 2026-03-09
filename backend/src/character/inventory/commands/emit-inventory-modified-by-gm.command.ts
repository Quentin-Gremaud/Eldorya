export class EmitInventoryModifiedByGmCommand {
  constructor(
    public readonly characterId: string,
    public readonly gmId: string,
    public readonly modificationType: string,
    public readonly itemId: string,
    public readonly details: Record<string, unknown>,
  ) {}
}
