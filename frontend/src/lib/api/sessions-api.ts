"use client";

import type {
  Session,
  StartSessionPayload,
  ChangeSessionModePayload,
} from "@/types/api";

type ApiFetch = <T>(path: string, options?: RequestInit) => Promise<T>;

export function createSessionsApi(apiFetch: ApiFetch) {
  return {
    getActiveSession: (campaignId: string) =>
      apiFetch<{ data: Session | null }>(
        `/api/campaigns/${campaignId}/sessions/active`
      ),

    startSession: (campaignId: string, payload: StartSessionPayload) =>
      apiFetch<void>(`/api/campaigns/${campaignId}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),

    changeSessionMode: (
      campaignId: string,
      sessionId: string,
      payload: ChangeSessionModePayload
    ) =>
      apiFetch<void>(
        `/api/campaigns/${campaignId}/sessions/${sessionId}/mode`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      ),
  };
}
