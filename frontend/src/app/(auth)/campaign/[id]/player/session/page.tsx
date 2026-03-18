"use client";

import { use, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useActiveSession } from "@/hooks/use-active-session";
import { useSessionWebSocket } from "@/hooks/use-session-web-socket";
import { useMapLevels } from "@/hooks/use-map-levels";
import { useTokens } from "@/hooks/use-tokens";
import { useFogState } from "@/hooks/use-fog-state";
import { useCampaign } from "@/hooks/use-campaign";
import { useWebSocketContext } from "@/providers/web-socket-provider";
import { WS_COMMANDS } from "@/lib/ws/ws-event-types";
import { MapCanvas } from "@/components/canvas/map-canvas";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock } from "lucide-react";
import Link from "next/link";
import { AppBreadcrumb } from "@/components/layout/app-breadcrumb";
import { useState } from "react";
import { PingNotification } from "@/components/features/action-pipeline/ping-notification";
import { ActionSubmissionPanel } from "@/components/features/action-pipeline/action-submission-panel";

export default function PlayerSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: campaignId } = use(params);
  const router = useRouter();
  const { campaign } = useCampaign(campaignId);
  const { session, isLoading: isSessionLoading } = useActiveSession(campaignId);
  const { socket } = useWebSocketContext();
  const { mapLevels } = useMapLevels(campaignId);

  const [selectedMapLevelId, setSelectedMapLevelId] = useState<string | null>(null);

  // Auto-select first map level
  useEffect(() => {
    if (!selectedMapLevelId && mapLevels && mapLevels.length > 0) {
      setSelectedMapLevelId(mapLevels[0].id);
    }
  }, [mapLevels, selectedMapLevelId]);

  // WebSocket for real-time mode updates
  useSessionWebSocket(campaignId);

  // Join session room via WebSocket when session is live
  useEffect(() => {
    if (session?.mode === "live" && session.id) {
      socket.emit(WS_COMMANDS.joinSession, { sessionId: session.id });
    }
  }, [session?.mode, session?.id, socket]);

  // Redirect if no active session
  useEffect(() => {
    if (!isSessionLoading && !session) {
      router.replace(`/campaign/${campaignId}/player`);
    }
  }, [isSessionLoading, session, campaignId, router]);

  const selectedMapLevel = mapLevels?.find((m) => m.id === selectedMapLevelId);
  const { tokens } = useTokens(campaignId, selectedMapLevelId ?? "");
  const { fogZones } = useFogState(
    campaignId,
    "__all__",
    selectedMapLevelId ?? ""
  );

  const isLive = session?.mode === "live";

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
            { label: campaign?.name ?? "Campaign", href: `/campaign/${campaignId}/player` },
            { label: "Session" },
          ]}
        />

        {/* Session Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild aria-label="Back to campaign">
            <Link href={`/campaign/${campaignId}/player`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              Game Session
            </h1>
            <div className="mt-1 flex items-center gap-2">
              {isLive ? (
                <Badge className="bg-green-600">LIVE</Badge>
              ) : (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-text-muted" />
                  <span className="text-sm text-text-secondary">
                    GM is preparing…
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Ping Notification */}
        {isLive && <PingNotification campaignId={campaignId} />}

        {/* GM Preparing Indicator */}
        {!isLive && (
          <div className="flex items-center justify-center rounded-lg border border-border p-12">
            <div className="text-center space-y-2">
              <Clock className="h-8 w-8 text-text-muted mx-auto" />
              <p className="text-text-secondary">
                The GM is preparing the session. The map will appear when the session goes live.
              </p>
            </div>
          </div>
        )}

        {/* Map Level Selector (only when live) */}
        {isLive && mapLevels && mapLevels.length > 1 && (
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

        {/* Map Canvas (only when live) */}
        {isLive && selectedMapLevel ? (
          <div className="rounded-lg border border-border overflow-hidden" style={{ height: "70vh" }}>
            <MapCanvas
              mapLevel={selectedMapLevel}
              tokens={tokens}
              interactive={false}
              viewMode="player"
              fogZones={fogZones}
              mapLevels={mapLevels}
            />
          </div>
        ) : isLive ? (
          <div className="flex items-center justify-center rounded-lg border border-border p-12">
            <p className="text-text-secondary">No map levels available.</p>
          </div>
        ) : null}

        {/* Action Submission (live only) */}
        {isLive && (
          <ActionSubmissionPanel
            campaignId={campaignId}
            sessionId={session.id}
          />
        )}
      </div>
    </main>
  );
}
