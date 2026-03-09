export class EquipItemCommand {
  constructor(
    public readonly characterId: string,
    public readonly itemId: string,
    public readonly slotType: string,
    public readonly userId: string,
  ) {}
}
