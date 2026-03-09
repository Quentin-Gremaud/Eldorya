export interface CharacterExistenceChecker {
  exists(campaignId: string, userId: string): Promise<boolean>;
}

export const CHARACTER_EXISTENCE_CHECKER = 'CHARACTER_EXISTENCE_CHECKER';
