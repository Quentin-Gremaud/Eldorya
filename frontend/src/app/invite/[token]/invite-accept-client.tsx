"use client";

import { useEffect, useRef, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAcceptInvitation } from "@/hooks/use-accept-invitation";

function InviteAcceptInner({
  token,
  campaignName,
}: {
  token: string;
  campaignName: string;
}) {
  const { accept, isPending, error } = useAcceptInvitation(token);
  const hasAccepted = useRef(false);

  useEffect(() => {
    if (hasAccepted.current) return;
    hasAccepted.current = true;
    accept();
  }, [accept]);

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface-base px-4">
        <div className="w-full max-w-md rounded-lg bg-surface-elevated p-8 text-center">
          <h1 className="text-2xl font-bold text-text-primary">
            Unable to join campaign
          </h1>
          <p className="mt-4 text-text-secondary">
            {(error as { message?: string })?.message ||
              "An error occurred while joining the campaign. Please try again."}
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={() => accept()}
              className="rounded-lg bg-accent-primary px-4 py-2.5 font-semibold text-surface-base transition-colors hover:bg-accent-primary-hover"
            >
              Retry
            </button>
            <a
              href="/dashboard"
              className="text-sm text-accent-primary hover:text-accent-primary-hover"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      </main>
    );
  }

  if (isPending) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface-base px-4">
        <div className="w-full max-w-md rounded-lg bg-surface-elevated p-8 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
          <h1 className="mt-4 text-xl font-bold text-text-primary">
            Joining {campaignName}...
          </h1>
          <p className="mt-2 text-text-secondary">
            Please wait while we add you to the campaign.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-base px-4">
      <div className="w-full max-w-md rounded-lg bg-surface-elevated p-8 text-center">
        <h1 className="text-xl font-bold text-text-primary">Redirecting...</h1>
        <p className="mt-2 text-text-secondary">
          You have been added to the campaign.
        </p>
      </div>
    </main>
  );
}

export function InviteAcceptClient({
  token,
  campaignName,
}: {
  token: string;
  campaignName: string;
}) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <InviteAcceptInner token={token} campaignName={campaignName} />
    </QueryClientProvider>
  );
}
