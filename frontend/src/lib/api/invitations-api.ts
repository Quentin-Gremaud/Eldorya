import { apiClient } from "./client";

interface ValidateInvitationResponse {
  valid: boolean;
  campaignId?: string;
  campaignName?: string;
  expired?: boolean;
}

export async function validateInvitation(
  token: string
): Promise<ValidateInvitationResponse> {
  const result = await apiClient<{ data: ValidateInvitationResponse }>(
    `/api/invitations/${token}/validate`
  );
  return result.data;
}

export interface CampaignInvitation {
  id: string;
  campaignId: string;
  createdAt: string;
  expiresAt: string | null;
  status: string;
}

export interface CreateInvitationResponse {
  token: string;
  inviteUrl: string;
  expiresAt: string;
}
