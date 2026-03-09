import type { CharacterModificationInput } from '../character-modification.js';

export class ModifyCharacterByGmCommand {
  constructor(
    public readonly characterId: string,
    public readonly modifiedBy: string,
    public readonly modifications: CharacterModificationInput,
  ) {}
}
