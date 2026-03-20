"use client";

import { use, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useActiveSession } from "@/hooks/use-active-session";
import { useChangeSessionMode } from "@/hooks/use-change-session-mode";
import { useSessionWebSocket } from "@/hooks/use-session-web-socket";
import { useMapLevels } from "@/hooks/use-map-levels";
import { useTokens } from "@/hooks/use-tokens";
import { useMoveToken } from "@/hooks/use-move-token";
import { useFogState } from "@/hooks/use-fog-state";
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
import { Play, Pause } from "lucide-react";
import { PendingActionQueue } from "@/components/features/action-pipeline/pending-action-queue";
import { useCampaignPlayers } from "@/hooks/use-campaign-players";
import { PlayerPingPanel } from "@/components/features/action-pipeline/player-ping-panel";
import { PipelineModeToggle } from "@/components/features/action-pipeline/pipeline-mode-toggle";

export default function GmSessionLivePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: campaignId } = use(params);
  const router = useRouter();
  const { session, isLoading: isSessionLoading } = useActiveSession(campaignId);
  const changeMode = useChangeSessionMode();
  const { mapLevels } = useMapLevels(campaignId);
  const { players } = useCampaignPlayers(campaignId);

  const [selectedMapLevelId, setSelectedMapLevelId] = useState<string | null>(null);
  const [goLiveDialogOpen, setGoLiveDialogOpen] = useState(false);

  useEffect(() => {
    if (!selectedMapLevelId && mapLevels && mapLevels.length > 0) {
      setSelectedMapLevelId(mapLevels[0].id);
    }
  }, [mapLevels, selectedMapLevelId]);

  useSessionWebSocket(campaignId);

  useEffect(() => {
    if (!isSessionLoading && !session) {
      router.replace(`/campaign/${campaignId}/gm/prep`);
    }
  }, [isSessionLoading, session, campaignId, router]);

  const selectedMapLevel = mapLevels?.find((m) => m.id === selectedMapLevelId);
  const { tokens } = useTokens(campaignId, selectedMapLevelId ?? "");
  const moveToken = useMoveToken(campaignId);
  const { fogZones } = useFogState(campaignId, null, selectedMapLevelId ?? "");

  const isLive = session?.mode === "live";

  const handleGoLive = useCallback(() => {
    if (!session) return;
    changeMode.mutate(
      { campaignId, sessionId: session.id, mode: "live" },
      { onSuccess: () => setGoLiveDialogOpen(false) }
    );
  }, [campaignId, session, changeMode]);

  const handleSwitchToPrep = useCallback(() => {
    if (!session) return;
    changeMode.mutate({ campaignId, sessionId: session.id, mode: "preparation" });
  }, [campaignId, session, changeMode]);

  const handleTokenMove = useCallback(
    (tokenId: string, x: number, y: number) => {
      moveToken.mutate({ tokenId, mapLevelId: selectedMapLevelId ?? "", x, y });
    },
    [moveToken, selectedMapLevelId]
  );

  if (isSessionLoading) {
    return (
      <main className="flex-1 p-4">
        <Skeleton className="h-96 w-full" />
      </main>
    );
  }

  if (!session) return null;

  return (
    <main className="flex-1 p-4">
      <div className="space-y-3">
        {/* Compact Session Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-text-primary">Session Live</h1>
            <Badge
              variant={isLive ? "default" : "secondary"}
              className={isLive ? "bg-green-600" : ""}
            >
              {isLive ? "LIVE" : "Preparation"}
            </Badge>
          </div>
          <div>
            {isLive ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSwitchToPrep}
                disabled={changeMode.isPending}
              >
                <Pause className="mr-2 h-4 w-4" />
                Switch to Prep
              </Button>
            ) : (
              <Button
                size="sm"
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
        <div className="flex gap-3">
          {/* Omniscient Map Canvas — GM sees all tokens, no fog */}
          <div className="flex-1 min-w-0">
            {selectedMapLevel ? (
              <div
                className="relative rounded-lg border border-border overflow-hidden"
                style={{ height: "calc(100vh - 140px)" }}
              >
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
                <p className="text-text-secondary">
                  No map levels available. Create maps in the prep page first.
                </p>
              </div>
            )}
          </div>

          {/* GM Side Panel (live only) */}
          {isLive && (
            <div className="w-56 shrink-0 space-y-3">
              <div className="rounded-lg border border-border bg-surface p-3">
                <PipelineModeToggle
                  campaignId={campaignId}
                  sessionId={session.id}
                />
              </div>
              <div className="rounded-lg border border-border bg-surface p-3">
                <PlayerPingPanel
                  campaignId={campaignId}
                  sessionId={session.id}
                  players={players.map((p) => ({
                    userId: p.userId,
                    displayName: p.displayName,
                  }))}
                />
              </div>
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
            <AlertDialogAction onClick={handleGoLive}>Go Live</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
