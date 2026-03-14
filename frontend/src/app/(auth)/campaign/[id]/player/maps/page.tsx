"use client";

import { use, useState, useCallback, Suspense, lazy } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";
import { useMapLevels } from "@/hooks/use-map-levels";
import { useTokens } from "@/hooks/use-tokens";
import { useFogState } from "@/hooks/use-fog-state";
import { useCampaignPlayers } from "@/hooks/use-campaign-players";
import { MapHierarchyTree } from "@/components/features/maps/map-hierarchy-tree";
import { MapBreadcrumb } from "@/components/features/maps/map-breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertCircle, Map, ArrowLeft } from "lucide-react";
import { useCampaign } from "@/hooks/use-campaign";
import { AppBreadcrumb } from "@/components/layout/app-breadcrumb";
import { toast } from "sonner";
import Link from "next/link";

const LazyMapCanvas = lazy(
  () =>
    import("@/components/canvas/map-canvas").then((m) => ({
      default: m.MapCanvas,
    }))
);

export function PlayerMapsContent({ campaignId }: { campaignId: string }) {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const { campaign, isLoading: isCampaignLoading, isError: isCampaignError } =
    useCampaign(campaignId);
  const { mapLevels, isLoading, isError } = useMapLevels(campaignId);
  const { players, isError: isPlayersError } = useCampaignPlayers(campaignId);
  const [selectedMapLevelId, setSelectedMapLevelId] = useState<string | null>(
    null
  );

  // Resolve current user's playerId from campaign players
  const playerId =
    players.find((p) => p.userId === user?.id)?.userId ?? null;

  // Auto-select first root level when map levels load
  const firstRootLevel =
    mapLevels.find((l) => l.parentId === null) ?? null;

  const effectiveSelectedId =
    selectedMapLevelId ??
    firstRootLevel?.id ??
    null;

  const {
    tokens,
    isLoading: _tokensLoading,
    isError: tokensError,
  } = useTokens(campaignId, effectiveSelectedId);

  const { fogZones } = useFogState(campaignId, playerId, effectiveSelectedId);

  const selectedLevel = mapLevels.find((l) => l.id === effectiveSelectedId);

  const handleLocationNavigate = useCallback(
    (destinationMapLevelId: string) => {
      setSelectedMapLevelId(destinationMapLevelId);
    },
    []
  );

  const handleBrokenLinkClick = useCallback(() => {
    toast.error("Linked map level no longer exists");
  }, []);

  if (isCampaignLoading || isLoading) {
    return (
      <main className="flex-1 flex flex-col h-full">
        <div className="flex items-center gap-2 p-4 border-b">
          <Map className="h-5 w-5 text-muted-foreground" />
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="flex flex-1 overflow-hidden">
          <div className="w-64 border-r p-2 space-y-2">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
          <div className="flex-1 flex items-center justify-center">
            <Skeleton className="h-64 w-64" />
          </div>
        </div>
      </main>
    );
  }

  if (isCampaignError || isError || isPlayersError) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center h-full">
        <AlertCircle className="h-8 w-8 text-destructive mb-2" />
        <p className="text-sm text-destructive">Failed to load map data.</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => {
            queryClient.invalidateQueries({
              queryKey: ["map-levels", campaignId],
            });
            queryClient.invalidateQueries({
              queryKey: ["campaign", campaignId],
            });
          }}
        >
          Retry
        </Button>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col h-full">
      {/* App-level navigation */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-1">
        <Button variant="ghost" size="icon" className="h-7 w-7" asChild aria-label="Go back">
          <Link href={`/campaign/${campaignId}/player`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <AppBreadcrumb
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: campaign?.name ?? "Campaign", href: `/campaign/${campaignId}/player` },
            { label: "Maps" },
          ]}
        />
      </div>

      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b">
        <Map className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-xl font-bold text-foreground">
          {campaign?.name ?? "Campaign"} — Map
        </h1>
      </div>

      {/* Breadcrumb */}
      {effectiveSelectedId && (
        <div className="px-4 py-2 border-b bg-muted">
          <MapBreadcrumb
            levels={mapLevels}
            selectedId={effectiveSelectedId}
            onSelect={setSelectedMapLevelId}
          />
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Tree (read-only: no onRename) */}
        <div className="w-64 border-r overflow-y-auto p-2">
          <MapHierarchyTree
            levels={mapLevels}
            selectedId={effectiveSelectedId}
            onSelect={setSelectedMapLevelId}
          />
        </div>

        {/* Canvas area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-muted/30">
          {selectedLevel ? (
            <>
              <div className="flex items-center px-4 py-2 border-b">
                <p className="text-sm font-medium text-foreground">
                  {selectedLevel.name}
                </p>
              </div>

              <div className="flex-1 overflow-hidden relative">
                {tokensError ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                    <p className="text-sm text-destructive">
                      Failed to load tokens.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() =>
                        queryClient.invalidateQueries({
                          queryKey: [
                            "tokens",
                            campaignId,
                            effectiveSelectedId,
                          ],
                        })
                      }
                    >
                      Retry
                    </Button>
                  </div>
                ) : (
                  <Suspense
                    fallback={
                      <div className="flex-1 flex items-center justify-center h-full">
                        <Skeleton className="h-64 w-64" />
                      </div>
                    }
                  >
                    <LazyMapCanvas
                      mapLevel={selectedLevel}
                      tokens={tokens}
                      interactive={false}
                      viewMode="player"
                      playerId={playerId ?? undefined}
                      fogZones={fogZones}
                      mapLevels={mapLevels}
                      onLocationNavigate={handleLocationNavigate}
                      onBrokenLinkClick={handleBrokenLinkClick}
                    />
                  </Suspense>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Map className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">No map levels yet</p>
                <p className="text-sm mt-1">
                  The GM hasn&apos;t created any maps for this campaign yet.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function PlayerMapsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: campaignId } = use(params);
  return <PlayerMapsContent campaignId={campaignId} />;
}
