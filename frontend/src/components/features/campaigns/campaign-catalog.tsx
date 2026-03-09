"use client";

import { CampaignSummary, PlayerCampaign } from "@/types/api";
import { CampaignCategoryRow } from "./campaign-category-row";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Gamepad2, Plus, Sword } from "lucide-react";

interface CampaignCatalogProps {
  campaigns: CampaignSummary[];
  playerCampaigns?: PlayerCampaign[];
  isPlayerLoading?: boolean;
  onCreateCampaign?: () => void;
  isCreateDisabled?: boolean;
}

export function CampaignCatalog({
  campaigns,
  playerCampaigns = [],
  isPlayerLoading,
  onCreateCampaign,
  isCreateDisabled,
}: CampaignCatalogProps) {
  const gmCampaigns = campaigns.filter(
    (c) => c.role === "gm" && c.status !== "archived"
  );
  const archivedCampaigns = campaigns.filter((c) => c.status === "archived");

  const hasNoCampaigns =
    gmCampaigns.length === 0 &&
    playerCampaigns.length === 0 &&
    archivedCampaigns.length === 0 &&
    !isPlayerLoading;

  if (hasNoCampaigns) {
    return (
      <EmptyState
        icon={<Gamepad2 className="h-12 w-12" />}
        title="No campaigns yet"
        description="Create your first campaign or join one to get started!"
        action={
          onCreateCampaign
            ? { label: "Create your first campaign", onClick: onCreateCampaign }
            : undefined
        }
      />
    );
  }

  return (
    <div className="space-y-8">
      {onCreateCampaign && (
        <div className="flex justify-end">
          <Button
            onClick={onCreateCampaign}
            disabled={isCreateDisabled}
            className="bg-accent-primary hover:bg-accent-primary/90"
          >
            <Plus className="h-4 w-4" />
            Create Campaign
          </Button>
        </div>
      )}
      {gmCampaigns.length > 0 && (
        <CampaignCategoryRow
          title="My Campaigns (as GM)"
          campaigns={gmCampaigns}
        />
      )}
      {playerCampaigns.length > 0 && (
        <CampaignCategoryRow
          title="Campaigns I Play In"
          campaigns={playerCampaigns}
        />
      )}
      {!isPlayerLoading && playerCampaigns.length === 0 && gmCampaigns.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-text-primary">
            Campaigns I Play In
          </h2>
          <EmptyState
            icon={<Sword className="h-10 w-10" />}
            title="You haven't joined any campaigns yet"
            description="Ask your GM for an invitation link to get started"
          />
        </section>
      )}
      {archivedCampaigns.length > 0 && (
        <CampaignCategoryRow
          title="Archived"
          campaigns={archivedCampaigns}
        />
      )}
    </div>
  );
}
