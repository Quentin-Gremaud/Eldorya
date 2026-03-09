"use client";

import { Component, ReactNode, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useCampaigns } from "@/hooks/use-campaigns";
import { usePlayerCampaigns } from "@/hooks/use-player-campaigns";
import { useActiveCampaignCount } from "@/hooks/use-active-campaign-count";
import { CampaignCatalog } from "@/components/features/campaigns/campaign-catalog";
import { CampaignCardSkeleton } from "@/components/shared/campaign-card-skeleton";
import { FreemiumGateDialog } from "@/components/features/campaigns/freemium-gate-dialog";
import { CreateCampaignForm } from "@/components/features/campaigns/create-campaign-form";
import { AlertCircle } from "lucide-react";

const FREE_TIER_LIMIT = 2;

class DashboardErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <p>Something went wrong displaying campaigns. Please refresh the page.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function DashboardPage() {
  const { user } = useUser();
  const { campaigns, isLoading, isError } = useCampaigns();
  const { campaigns: playerCampaigns, isLoading: isPlayerLoading } = usePlayerCampaigns();
  const { activeCount, isLoading: isCountLoading } = useActiveCampaignCount();
  const [showGateDialog, setShowGateDialog] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCreateCampaign = () => {
    if (isCountLoading || activeCount === undefined) {
      return;
    }
    // TODO(EPIC-9): Add Pro tier check — Pro users bypass the limit
    if (activeCount >= FREE_TIER_LIMIT) {
      setShowGateDialog(true);
    } else {
      setShowCreateForm(true);
    }
  };

  return (
    <main className="min-h-screen bg-surface-base p-8" aria-label="Dashboard">
      <h1 className="text-3xl font-bold text-text-primary">
        {user?.firstName ? `Welcome, ${user.firstName}` : "Dashboard"}
      </h1>
      <p className="mt-2 text-text-secondary">
        Your campaigns at a glance.
      </p>

      <div className="mt-8">
        {isLoading && (
          <div className="flex gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <CampaignCardSkeleton key={i} />
            ))}
          </div>
        )}

        {isError && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p>Failed to load campaigns. Please try again later.</p>
          </div>
        )}

        {!isLoading && !isError && (
          <DashboardErrorBoundary>
            <CampaignCatalog
              campaigns={campaigns}
              playerCampaigns={playerCampaigns}
              isPlayerLoading={isPlayerLoading}
              onCreateCampaign={handleCreateCampaign}
              isCreateDisabled={isCountLoading}
            />
          </DashboardErrorBoundary>
        )}
      </div>

      <FreemiumGateDialog
        open={showGateDialog}
        onOpenChange={setShowGateDialog}
      />

      <CreateCampaignForm
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
      />
    </main>
  );
}
