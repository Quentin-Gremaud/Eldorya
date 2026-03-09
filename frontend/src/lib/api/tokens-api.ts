"use client";

import type { Token, PlaceTokenPayload, MoveTokenPayload, RemoveTokenPayload } from "@/types/api";

type ApiFetch = <T>(path: string, options?: RequestInit) => Promise<T>;

export function createTokensApi(apiFetch: ApiFetch) {
  return {
    getTokens: (campaignId: string, mapLevelId: string) =>
      apiFetch<{ data: Token[] }>(
        `/api/campaigns/${campaignId}/tokens?mapLevelId=${mapLevelId}`
      ),

    placeToken: (campaignId: string, payload: PlaceTokenPayload) =>
      apiFetch<void>(`/api/campaigns/${campaignId}/tokens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),

    moveToken: (
      campaignId: string,
      tokenId: string,
      payload: MoveTokenPayload
    ) =>
      apiFetch<void>(
        `/api/campaigns/${campaignId}/tokens/${tokenId}/position`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      ),

    removeToken: (
      campaignId: string,
      tokenId: string,
      payload: RemoveTokenPayload
    ) =>
      apiFetch<void>(`/api/campaigns/${campaignId}/tokens/${tokenId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
  };
}
