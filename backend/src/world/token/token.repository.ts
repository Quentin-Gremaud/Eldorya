import type { TokenAggregate } from './token.aggregate.js';

export interface TokenRepository {
  saveNew(aggregate: TokenAggregate): Promise<void>;
  save(aggregate: TokenAggregate): Promise<void>;
  load(campaignId: string): Promise<TokenAggregate>;
}

export const TOKEN_REPOSITORY = 'TOKEN_REPOSITORY';
