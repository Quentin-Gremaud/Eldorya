export class PipelineModeChanged {
  readonly type = 'PipelineModeChanged' as const;

  constructor(
    public readonly sessionId: string,
    public readonly campaignId: string,
    public readonly gmUserId: string,
    public readonly pipelineMode: string,
    public readonly changedAt: string,
  ) {}
}
