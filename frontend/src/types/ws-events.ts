// WebSocket event types — will be expanded per story

export interface WsEventPayload<T = unknown> {
  type: string;
  data: T;
  metadata: {
    campaignId: string;
    sessionId?: string;
    timestamp: string;
  };
}
