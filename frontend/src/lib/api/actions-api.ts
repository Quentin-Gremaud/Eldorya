"use client";

import type {
  PendingAction,
  PingStatus,
  PingPlayerPayload,
  ProposeActionPayload,
} from "@/types/api";

type ApiFetch = <T>(path: string, options?: RequestInit) => Promise<T>;

export function createActionsApi(apiFetch: ApiFetch) {
  return {
    pingPlayer: (
      campaignId: string,
      sessionId: string,
      payload: PingPlayerPayload
    ) =>
      apiFetch<void>(
        `/api/campaigns/${campaignId}/sessions/${sessionId}/ping`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      ),

    proposeAction: (
      campaignId: string,
      sessionId: string,
      payload: ProposeActionPayload
    ) =>
      apiFetch<void>(
        `/api/campaigns/${campaignId}/sessions/${sessionId}/actions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      ),

    getPendingActions: (campaignId: string, sessionId: string) =>
      apiFetch<{ data: PendingAction[] }>(
        `/api/campaigns/${campaignId}/sessions/${sessionId}/actions/pending`
      ),

    getPingStatus: (campaignId: string, sessionId: string) =>
      apiFetch<{ data: PingStatus | null }>(
        `/api/campaigns/${campaignId}/sessions/${sessionId}/ping-status`
      ),
  };
}
