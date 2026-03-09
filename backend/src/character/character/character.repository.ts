import type { Character } from './character.aggregate.js';

export interface CharacterRepository {
  saveNew(character: Character): Promise<void>;
  save(character: Character): Promise<void>;
  load(characterId: string): Promise<Character>;
}

export const CHARACTER_REPOSITORY = 'CHARACTER_REPOSITORY';
