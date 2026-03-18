"use client";

import { use, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useActiveSession } from "@/hooks/use-active-session";
import { useChangeSessionMode } from "@/hooks/use-change-session-mode";
import { useSessionWebSocket } from "@/hooks/use-session-web-socket";
import { useMapLevels } from "@/hooks/use-map-levels";
import { useTokens } from "@/hooks/use-tokens";
import { useMoveToken } from "@/hooks/use-move-token";
import { useFogState } from "@/hooks/use-fog-state";
import { useCampaign } from "@/hooks/use-campaign";
import { MapCanvas } from "@/components/canvas/map-canvas";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Play, Pause } from "lucide-react";
import Link from "next/link";
import { AppBreadcrumb } from "@/components/layout/app-breadcrumb";
import { useEffect } from "react";
import { useCampaignPlayers } from "@/hooks/use-campaign-players";
import { PlayerPingPanel } from "@/components/features/action-pipeline/player-ping-panel";
import { PendingActionQueue } from "@/components/features/action-pipeline/pending-action-queue";

export default function GmSessionCockpitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: campaignId } = use(params);
  const router = useRouter();
  const { campaign } = useCampaign(campaignId);
  const { session, isLoading: isSessionLoading } = useActiveSession(campaignId);
  const changeMode = useChangeSessionMode();
  const { mapLevels } = useMapLevels(campaignId);
  const { players } = useCampaignPlayers(campaignId);

  const [selectedMapLevelId, setSelectedMapLevelId] = useState<string | null>(null);
  const [goLiveDialogOpen, setGoLiveDialogOpen] = useState(false);

  // Auto-select first map level
  useEffect(() => {
    if (!selectedMapLevelId && mapLevels && mapLevels.length > 0) {
      setSelectedMapLevelId(mapLevels[0].id);
    }
  }, [mapLevels, selectedMapLevelId]);

  // WebSocket for real-time mode updates
  useSessionWebSocket(campaignId);

  // Redirect if no active session
  useEffect(() => {
    if (!isSessionLoading && !session) {
      router.replace(`/campaign/${campaignId}/gm/prep`);
    }
  }, [isSessionLoading, session, campaignId, router]);

  const selectedMapLevel = mapLevels?.find((m) => m.id === selectedMapLevelId);
  const { tokens } = useTokens(campaignId, selectedMapLevelId ?? "");
  const moveToken = useMoveToken(campaignId, selectedMapLevelId ?? "");
  const { fogZones } = useFogState(
    campaignId,
    "__all__",
    selectedMapLevelId ?? ""
  );

  const isLive = session?.mode === "live";

  const handleGoLive = useCallback(() => {
    if (!session) return;
    changeMode.mutate(
      {
        campaignId,
        sessionId: session.id,
        mode: "live",
      },
      {
        onSuccess: () => setGoLiveDialogOpen(false),
      }
    );
  }, [campaignId, session, changeMode]);

  const handleSwitchToPrep = useCallback(() => {
    if (!session) return;
    changeMode.mutate({
      campaignId,
      sessionId: session.id,
      mode: "preparation",
    });
  }, [campaignId, session, changeMode]);

  const handleTokenMove = useCallback(
    (tokenId: string, x: number, y: number) => {
      moveToken.mutate({ tokenId, x, y, commandId: crypto.randomUUID() });
    },
    [moveToken]
  );

  if (isSessionLoading) {
    return (
      <main className="flex-1 p-6 lg:p-8">
        <Skeleton className="h-96 w-full" />
      </main>
    );
  }

  if (!session) return null;

  return (
    <main className="flex-1 p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-4">
        <AppBreadcrumb
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: campaign?.name ?? "Campaign", href: `/campaign/${campaignId}/gm/prep` },
            { label: "Session" },
          ]}
        />

        {/* Session Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild aria-label="Back to campaign">
              <Link href={`/campaign/${campaignId}/gm/prep`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">
                Session Cockpit
              </h1>
              <div className="mt-1 flex items-center gap-2">
                <Badge
                  variant={isLive ? "default" : "secondary"}
                  className={isLive ? "bg-green-600" : ""}
                >
                  {isLive ? "LIVE" : "Preparation"}
                </Badge>
              </div>
            </div>
          </div>

          <div>
            {isLive ? (
              <Button
                variant="outline"
                onClick={handleSwitchToPrep}
                disabled={changeMode.isPending}
              >
                <Pause className="mr-2 h-4 w-4" />
                Switch to Prep
              </Button>
            ) : (
              <Button
                onClick={() => setGoLiveDialogOpen(true)}
                disabled={changeMode.isPending}
              >
                <Play className="mr-2 h-4 w-4" />
                Go Live
              </Button>
            )}
          </div>
        </div>

        {/* Map Level Selector */}
        {mapLevels && mapLevels.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            {mapLevels.map((level) => (
              <Button
                key={level.id}
                variant={selectedMapLevelId === level.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedMapLevelId(level.id)}
              >
                {level.name}
              </Button>
            ))}
          </div>
        )}

        {/* Map + Side Panel */}
        <div className="flex gap-4">
          {/* Map Canvas */}
          <div className="flex-1 min-w-0">
            {selectedMapLevel ? (
              <div className="relative rounded-lg border border-border overflow-hidden" style={{ height: "70vh" }}>
                <MapCanvas
                  mapLevel={selectedMapLevel}
                  tokens={tokens}
                  interactive={true}
                  viewMode="gm"
                  fogZones={fogZones}
                  mapLevels={mapLevels}
                  onTokenMove={handleTokenMove}
                />
                {isLive && (
                  <PendingActionQueue
                    campaignId={campaignId}
                    sessionId={session.id}
                    isGm
                  />
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center rounded-lg border border-border p-12">
                <p className="text-text-secondary">No map levels available. Create maps in the prep page first.</p>
              </div>
            )}
          </div>

          {/* GM Side Panel (live only) */}
          {isLive && (
            <div className="w-64 shrink-0 rounded-lg border border-border bg-surface p-4">
              <PlayerPingPanel
                campaignId={campaignId}
                sessionId={session.id}
                players={players.map((p) => ({
                  userId: p.userId,
                  displayName: p.displayName,
                }))}
              />
            </div>
          )}
        </div>
      </div>

      {/* Go Live Confirmation Dialog */}
      <AlertDialog open={goLiveDialogOpen} onOpenChange={setGoLiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Go Live?</AlertDialogTitle>
            <AlertDialogDescription>
              Players will be notified and can join the session. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleGoLive}>
              Go Live
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
