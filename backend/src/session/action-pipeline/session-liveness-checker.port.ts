export interface LiveSessionInfo {
  sessionId: string;
  campaignId: string;
  gmUserId: string;
}

export interface SessionLivenessChecker {
  getLiveSession(sessionId: string, campaignId: string): Promise<LiveSessionInfo | null>;
}

export const SESSION_LIVENESS_CHECKER = 'SESSION_LIVENESS_CHECKER';
