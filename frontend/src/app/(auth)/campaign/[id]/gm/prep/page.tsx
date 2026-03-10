"use client";

import { use, useState } from "react";
import { useCampaign } from "@/hooks/use-campaign";
import { useCampaignPlayers } from "@/hooks/use-campaign-players";
import { useCampaignAnnouncements } from "@/hooks/use-campaign-announcements";
import { InvitationManager } from "@/components/features/campaigns/invitation-manager";
import { PlayerOnboardingList } from "@/components/features/campaigns/player-onboarding-list";
import { CampaignReadinessIndicator } from "@/components/features/campaigns/campaign-readiness-indicator";
import { AnnouncementComposer } from "@/components/features/campaigns/announcement-composer";
import { AnnouncementList } from "@/components/features/campaigns/announcement-list";
import { ArchiveCampaignDialog } from "@/components/features/campaigns/archive-campaign-dialog";
import { ReactivateCampaignButton } from "@/components/features/campaigns/reactivate-campaign-button";
import { PendingCharactersList } from "@/components/features/characters/pending-characters-list";
import { PendingModificationsList } from "@/components/features/characters/pending-modifications-list";
import { CampaignCharactersList } from "@/components/features/characters/campaign-characters-list";
import { usePendingCharacters } from "@/hooks/use-pending-characters";
import { usePendingModifications } from "@/hooks/use-pending-modifications";
import { useCampaignCharacters } from "@/hooks/use-campaign-characters";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Megaphone, Archive, ShieldAlert, Users, Swords, ArrowLeft, Map, ChevronRight } from "lucide-react";
import Link from "next/link";
import { AppBreadcrumb } from "@/components/layout/app-breadcrumb";

export default function GmPrepPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: campaignId } = use(params);
  const { campaign, isLoading } = useCampaign(campaignId);
  const {
    players,
    hasActiveInvitation,
    allReady,
    playerCount,
    isLoading: isPlayersLoading,
    isError: isPlayersError,
  } = useCampaignPlayers(campaignId);
  const {
    announcements,
    totalCount: announcementCount,
    isLoading: isAnnouncementsLoading,
    isError: isAnnouncementsError,
  } = useCampaignAnnouncements(campaignId);

  const {
    pendingCharacters,
    isLoading: isPendingLoading,
    isError: isPendingError,
  } = usePendingCharacters(campaignId);

  const {
    modifications: pendingModifications,
    isLoading: isModificationsLoading,
    isError: isModificationsError,
  } = usePendingModifications(campaignId);

  const {
    characters: approvedCharacters,
    isLoading: isCharactersLoading,
  } = useCampaignCharacters(campaignId);

  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);

  const isArchived = campaign?.status === "archived";
  // TODO: Replace with actual subscription check when subscription system is implemented
  const isProUser = false;

  return (
    <main className="flex-1 p-6 lg:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <AppBreadcrumb
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: campaign?.name ?? "Campaign" },
          ]}
        />

        {/* Campaign Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild aria-label="Go back">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            {isLoading ? (
              <Skeleton className="h-8 w-64" />
            ) : (
              <h1 className="text-2xl font-bold text-text-primary">
                {campaign?.name ?? "Campaign"}
              </h1>
            )}
            <p className="mt-1 text-sm text-text-secondary">
              Campaign Management
            </p>
          </div>
        </div>

        {/* Maps Navigation */}
        <div>
          <Link href={`/campaign/${campaignId}/gm/prep/maps`}>
            <Card className="bg-surface-elevated transition-colors hover:bg-surface-elevated/80 cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Map className="h-5 w-5" />
                  Maps
                  <ChevronRight className="ml-auto h-4 w-4 text-text-muted" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-secondary">Manage campaign maps and levels</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Read-Only Banner for Archived Campaigns */}
        {isArchived && (
          <div className="flex items-center gap-2 rounded-md border border-warning/30 bg-warning/10 px-4 py-3">
            <ShieldAlert className="h-5 w-5 text-warning" />
            <p className="text-sm font-medium text-warning">
              This campaign is archived (read-only). No changes can be made.
            </p>
          </div>
        )}

        {/* Invitation Management Section */}
        {!isArchived && (
          <Card className="bg-surface-elevated">
            <CardHeader>
              <CardTitle className="text-lg">Player Invitations</CardTitle>
            </CardHeader>
            <CardContent>
              <InvitationManager campaignId={campaignId} />
            </CardContent>
          </Card>
        )}

        {/* Players & Onboarding Section */}
        <Card className="bg-surface-elevated">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">Players</CardTitle>
              {!isPlayersLoading && playerCount > 0 && (
                <Badge variant="secondary">{playerCount}</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isPlayersError ? (
              <div className="flex items-center gap-2 rounded-md border border-danger/30 bg-danger/10 px-4 py-3">
                <AlertCircle className="h-5 w-5 text-danger" />
                <p className="text-sm text-danger">
                  Failed to load player data. Please try again later.
                </p>
              </div>
            ) : (
              <>
                <CampaignReadinessIndicator
                  players={players}
                  allReady={allReady}
                />
                <PlayerOnboardingList
                  players={players}
                  hasActiveInvitation={hasActiveInvitation}
                  isLoading={isPlayersLoading}
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* Pending Character Reviews Section */}
        {!isArchived && (
          <Card className="bg-surface-elevated">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-text-secondary" />
                <CardTitle className="text-lg">Character Reviews</CardTitle>
                {!isPendingLoading && (pendingCharacters.length + pendingModifications.length) > 0 && (
                  <Badge className="border-amber-500/30 bg-amber-500/20 text-amber-400">
                    {pendingCharacters.length + pendingModifications.length}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <PendingModificationsList
                campaignId={campaignId}
                modifications={pendingModifications}
                isLoading={isModificationsLoading}
                isError={isModificationsError}
              />
              <PendingCharactersList
                campaignId={campaignId}
                characters={pendingCharacters}
                isLoading={isPendingLoading}
                isError={isPendingError}
              />
            </CardContent>
          </Card>
        )}

        {/* Character Management Section */}
        {!isArchived && (
          <Card className="bg-surface-elevated">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Swords className="h-5 w-5 text-text-secondary" />
                <CardTitle className="text-lg">Character Management</CardTitle>
                {!isCharactersLoading && approvedCharacters.length > 0 && (
                  <Badge variant="secondary">{approvedCharacters.length}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <CampaignCharactersList campaignId={campaignId} />
            </CardContent>
          </Card>
        )}

        {/* Announcements Section */}
        <Card className="bg-surface-elevated">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-text-secondary" />
              <CardTitle className="text-lg">Announcements</CardTitle>
              {!isAnnouncementsLoading && announcementCount > 0 && (
                <Badge variant="secondary">{announcementCount}</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isArchived && (
              <AnnouncementComposer campaignId={campaignId} />
            )}
            {isAnnouncementsError ? (
              <div className="flex items-center gap-2 rounded-md border border-danger/30 bg-danger/10 px-4 py-3">
                <AlertCircle className="h-5 w-5 text-danger" />
                <p className="text-sm text-danger">
                  Failed to load announcements. Please try again later.
                </p>
              </div>
            ) : (
              <AnnouncementList
                announcements={announcements}
                isLoading={isAnnouncementsLoading}
                role="gm"
              />
            )}
          </CardContent>
        </Card>
        {/* Danger Zone — Archive (only for active campaigns) */}
        {!isLoading && !isArchived && (
          <Card className="border-destructive/30 bg-surface-elevated">
            <CardHeader>
              <CardTitle className="text-lg text-destructive">
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-text-secondary mb-4">
                Archiving will make this campaign read-only. No new sessions can
                be launched, but all history is preserved.
              </p>
              <Button
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive/10"
                onClick={() => setArchiveDialogOpen(true)}
              >
                <Archive className="mr-2 h-4 w-4" />
                Archive Campaign
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Reactivation Section — for archived campaigns */}
        {!isLoading && isArchived && (
          <Card className="bg-surface-elevated">
            <CardHeader>
              <CardTitle className="text-lg">Campaign Reactivation</CardTitle>
            </CardHeader>
            <CardContent>
              {isProUser ? (
                <ReactivateCampaignButton campaignId={campaignId} />
              ) : (
                <p className="text-sm text-text-secondary">
                  Upgrade to Pro to reactivate this archived campaign.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Archive Confirmation Dialog */}
        {campaign && (
          <ArchiveCampaignDialog
            campaignId={campaignId}
            campaignName={campaign.name}
            isProUser={isProUser}
            open={archiveDialogOpen}
            onOpenChange={setArchiveDialogOpen}
          />
        )}
      </div>
    </main>
  );
}
