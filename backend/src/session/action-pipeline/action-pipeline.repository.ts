import type { ActionPipelineAggregate } from './action-pipeline.aggregate.js';

export interface ActionPipelineRepository {
  saveNew(aggregate: ActionPipelineAggregate): Promise<void>;
  save(aggregate: ActionPipelineAggregate): Promise<void>;
  load(sessionId: string): Promise<ActionPipelineAggregate>;
  loadOrCreate(sessionId: string, campaignId: string): Promise<ActionPipelineAggregate>;
}

export const ACTION_PIPELINE_REPOSITORY = 'ACTION_PIPELINE_REPOSITORY';
