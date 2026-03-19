export class TogglePipelineModeCommand {
  constructor(
    public readonly sessionId: string,
    public readonly campaignId: string,
    public readonly callerUserId: string,
    public readonly pipelineMode: string,
  ) {}
}
