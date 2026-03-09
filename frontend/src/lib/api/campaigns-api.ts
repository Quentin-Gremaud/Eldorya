import { apiClient } from "./client";

export function createCampaign(
  payload: { id: string; name: string; description?: string },
  token: string
): Promise<void> {
  return apiClient("/api/campaigns", {
    method: "POST",
    body: JSON.stringify(payload),
    token,
  });
}
