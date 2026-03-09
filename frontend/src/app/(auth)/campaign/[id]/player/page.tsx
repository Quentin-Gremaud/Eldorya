"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCampaign } from "@/hooks/use-campaign";
import { useCampaignAnnouncements } from "@/hooks/use-campaign-announcements";
import { useMyCharacter } from "@/hooks/use-my-character";
import { AnnouncementList } from "@/components/features/campaigns/announcement-list";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, User, Map, BookOpen, Backpack, Megaphone, AlertCircle, ChevronRight } from "lucide-react";
import { formatRelativeDate } from "@/lib/utils";

export function PlayerCampaignContent({
  campaignId,
}: {
  campaignId: string;
}) {
  const { campaign, isLoading, isError } = useCampaign(campaignId);
  const {
    announcements,
    totalCount: announcementCount,
    isLoading: isAnnouncementsLoading,
    isError: isAnnouncementsError,
  } = useCampaignAnnouncements(campaignId);
  const { character, isLoading: isCharacterLoading } = useMyCharacter(campaignId);
  const router = useRouter();

  useEffect(() => {
    if (isError) {
      router.replace("/dashboard");
    }
  }, [isError, router]);

  if (isLoading) {
    return (
      <main className="flex-1 p-6 lg:p-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </main>
    );
  }

  if (!campaign) {
    return null;
  }

  return (
    <main className="flex-1 p-6 lg:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Campaign Header */}
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {campaign.name}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            GM: {campaign.gmDisplayName}
          </p>
          <div className="mt-2 flex items-center gap-4 text-sm text-text-muted">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {campaign.playerCount} players
            </span>
            {campaign.lastSessionDate && (() => {
              const relative = formatRelativeDate(campaign.lastSessionDate);
              if (!relative) return null;
              return (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Last session {relative}
                </span>
              );
            })()}
          </div>
        </div>

        {campaign.description && (
          <p className="text-sm text-text-secondary">{campaign.description}</p>
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
          <CardContent>
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
                role="player"
              />
            )}
          </CardContent>
        </Card>

        {/* Placeholder Sections */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link href={`/campaign/${campaignId}/player/character`}>
            <Card className="bg-surface-elevated transition-colors hover:bg-surface-elevated/80 cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-5 w-5" />
                  Character
                  <ChevronRight className="ml-auto h-4 w-4 text-text-muted" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isCharacterLoading ? (
                  <Skeleton className="h-4 w-32" />
                ) : character ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">{character.name}</span>
                    <Badge
                      variant={
                        character.status === "approved"
                          ? "default"
                          : character.status === "rejected"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {character.status === "pending_revalidation" ? "Pending" : character.status}
                    </Badge>
                  </div>
                ) : (
                  <p className="text-sm text-text-muted">Create your character</p>
                )}
              </CardContent>
            </Card>
          </Link>

          <Card className="bg-surface-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Map className="h-5 w-5" />
                Map
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-text-muted">
                Map exploration coming in Epic 4
              </p>
            </CardContent>
          </Card>

          <Card className="bg-surface-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-5 w-5" />
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-text-muted">
                Personal notes coming in Epic 8
              </p>
            </CardContent>
          </Card>

          <Link href={`/campaign/${campaignId}/player/character`}>
            <Card className="bg-surface-elevated transition-colors hover:bg-surface-elevated/80 cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Backpack className="h-5 w-5" />
                  Inventory
                  <ChevronRight className="ml-auto h-4 w-4 text-text-muted" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isCharacterLoading ? (
                  <Skeleton className="h-4 w-32" />
                ) : character?.status === "approved" ? (
                  <p className="text-sm text-text-secondary">Manage your equipment</p>
                ) : character ? (
                  <p className="text-sm text-text-muted">Available after character approval</p>
                ) : (
                  <p className="text-sm text-text-muted">Create a character first</p>
                )}
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function PlayerCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: campaignId } = use(params);
  return <PlayerCampaignContent campaignId={campaignId} />;
}
