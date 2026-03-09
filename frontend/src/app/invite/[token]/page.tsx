import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { InviteAcceptClient } from "./invite-accept-client";
import { InviteError } from "./invite-error";
import { validateInvitation } from "@/lib/api/invitations-api";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const result = await validateInvitation(token);

  if (!result.valid) {
    return <InviteError expired={result.expired} />;
  }

  const { userId } = await auth();

  if (!userId) {
    redirect(`/sign-up?redirect_url=${encodeURIComponent(`/invite/${token}`)}`);
  }

  return (
    <InviteAcceptClient
      token={token}
      campaignName={result.campaignName ?? "the campaign"}
    />
  );
}
