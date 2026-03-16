import type { SessionAggregate } from './session.aggregate.js';

export interface SessionRepository {
  saveNew(aggregate: SessionAggregate): Promise<void>;
  save(aggregate: SessionAggregate): Promise<void>;
  load(sessionId: string): Promise<SessionAggregate>;
}

export const SESSION_REPOSITORY = 'SESSION_REPOSITORY';
