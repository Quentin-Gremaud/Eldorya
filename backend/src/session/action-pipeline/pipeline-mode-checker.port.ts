export const PIPELINE_MODE_CHECKER = Symbol('PipelineModeChecker');

export interface PipelineModeChecker {
  getPipelineMode(
    sessionId: string,
    campaignId: string,
  ): Promise<'optional' | 'mandatory'>;
}
