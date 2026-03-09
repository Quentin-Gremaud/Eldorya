export class RejectACharacterCommand {
  constructor(
    public readonly characterId: string,
    public readonly rejectedBy: string,
    public readonly reason: string,
  ) {}
}
