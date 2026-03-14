"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useMapLevels } from "@/hooks/use-map-levels";
import { useCreateMapLevel } from "@/hooks/use-create-map-level";
import { useRenameMapLevel } from "@/hooks/use-rename-map-level";
import { useTokens } from "@/hooks/use-tokens";
import { usePlaceToken } from "@/hooks/use-place-token";
import { useMoveToken } from "@/hooks/use-move-token";
import { useRemoveToken } from "@/hooks/use-remove-token";
import { useLinkLocationToken } from "@/hooks/use-link-location-token";
import { useCampaignPlayers } from "@/hooks/use-campaign-players";
import { useRevealFogZone } from "@/hooks/use-reveal-fog-zone";
import { useRevealFogZoneToAll } from "@/hooks/use-reveal-fog-zone-to-all";
import { useHideFogZone } from "@/hooks/use-hide-fog-zone";
import { useHideFogZoneToAll } from "@/hooks/use-hide-fog-zone-to-all";
import { useFogState } from "@/hooks/use-fog-state";
import { MapHierarchyTree } from "@/components/features/maps/map-hierarchy-tree";
import { MapBreadcrumb } from "@/components/features/maps/map-breadcrumb";
import { CreateMapLevelDialog } from "@/components/features/maps/create-map-level-dialog";
import { ImportMapBackgroundButton } from "@/components/features/maps/import-map-background-button";
import { MapCanvas } from "@/components/canvas/map-canvas";
import { TokenPalette } from "@/components/features/maps/token-palette";
import { LocationLinkDialog } from "@/components/features/maps/location-link-dialog";
import { PlayerPreviewBar } from "@/components/features/maps/player-preview-bar";
import { FogToolbar, type FogTool } from "@/components/features/fog/fog-toolbar";
import { FogPlayerSelector } from "@/components/features/fog/fog-player-selector";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertCircle, Plus, Map, Eye, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useCampaign } from "@/hooks/use-campaign";
import { AppBreadcrumb } from "@/components/layout/app-breadcrumb";

export default function GmPrepMapsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: campaignId } = use(params);
  const queryClient = useQueryClient();
  const { campaign } = useCampaign(campaignId);
  const { mapLevels, isLoading, isError } = useMapLevels(campaignId);
  const createMapLevel = useCreateMapLevel(campaignId);
  const renameMapLevel = useRenameMapLevel(campaignId);
  const { players } = useCampaignPlayers(campaignId);

  const [selectedMapLevelId, setSelectedMapLevelId] = useState<string | null>(
    null
  );
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewPlayerId, setPreviewPlayerId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<FogTool>("select");
  const [fogTargetPlayerId, setFogTargetPlayerId] = useState<string | null>(
    null
  );

  const revealFogZone = useRevealFogZone(campaignId);
  const revealFogZoneToAll = useRevealFogZoneToAll(campaignId);
  const hideFogZone = useHideFogZone(campaignId);
  const hideFogZoneToAll = useHideFogZoneToAll(campaignId);
  const { fogZones } = useFogState(
    campaignId,
    isPreviewMode ? previewPlayerId : fogTargetPlayerId,
    selectedMapLevelId
  );

  const exitPreview = useCallback(() => {
    setIsPreviewMode(false);
    setPreviewPlayerId(null);
  }, []);

  const enterPreview = useCallback(() => {
    if (players.length > 0) {
      setIsPreviewMode(true);
      setPreviewPlayerId(players[0].userId);
    }
  }, [players]);

  useEffect(() => {
    if (!isPreviewMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        exitPreview();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isPreviewMode, exitPreview]);

  const { tokens, isLoading: tokensLoading, isError: tokensError } = useTokens(
    campaignId,
    selectedMapLevelId
  );
  const placeToken = usePlaceToken(campaignId);
  const moveToken = useMoveToken(campaignId);
  const removeToken = useRemoveToken(campaignId);
  const linkLocationToken = useLinkLocationToken(campaignId);

  const [locationLinkDialog, setLocationLinkDialog] = useState<{
    open: boolean;
    tokenId: string;
    mapLevelId: string;
    x: number;
    y: number;
    label: string;
    editMode?: boolean;
    initialDestinationId?: string;
  } | null>(null);

  const handleCreateLevel = (data: { name: string; parentId?: string }) => {
    createMapLevel.mutate(
      {
        mapLevelId: crypto.randomUUID(),
        name: data.name,
        parentId: data.parentId,
      },
      {
        onSuccess: () => setCreateDialogOpen(false),
      }
    );
  };

  const handleRenameLevel = (mapLevelId: string, newName: string) => {
    renameMapLevel.mutate({
      mapLevelId,
      newName,
    });
  };

  const handleTokenPlace = (
    tokenId: string,
    mapLevelId: string,
    x: number,
    y: number,
    tokenType: string,
    label: string
  ) => {
    if (tokenType === "location") {
      // Open dialog to select destination before placing
      setLocationLinkDialog({
        open: true,
        tokenId,
        mapLevelId,
        x,
        y,
        label,
      });
      return;
    }
    placeToken.mutate({ tokenId, mapLevelId, x, y, tokenType, label });
  };

  const handleLocationLinkSelect = (destinationMapLevelId: string) => {
    if (!locationLinkDialog) return;
    const { tokenId, mapLevelId, x, y, label } = locationLinkDialog;
    if (locationLinkDialog.editMode) {
      // Updating existing token destination
      linkLocationToken.mutate({ tokenId, mapLevelId, destinationMapLevelId });
    } else {
      // Placing new location token with destination
      placeToken.mutate({
        tokenId,
        mapLevelId,
        x,
        y,
        tokenType: "location",
        label,
        destinationMapLevelId,
      });
    }
    setLocationLinkDialog(null);
  };

  const handleLocationLinkCancel = () => {
    // If it was a new token placement, do nothing (token wasn't placed yet)
    setLocationLinkDialog(null);
  };

  const handleLocationNavigate = useCallback(
    (destinationMapLevelId: string) => {
      setSelectedMapLevelId(destinationMapLevelId);
    },
    []
  );

  const handleBrokenLinkClick = useCallback(() => {
    toast.error("Linked map level no longer exists");
  }, []);

  const handleTokenMove = (tokenId: string, x: number, y: number) => {
    if (!selectedMapLevelId) return;
    moveToken.mutate({ tokenId, mapLevelId: selectedMapLevelId, x, y });
  };

  const handleTokenRemove = (tokenId: string) => {
    if (!selectedMapLevelId) return;
    removeToken.mutate({ tokenId, mapLevelId: selectedMapLevelId });
  };

  const handleToolChange = useCallback(
    (tool: FogTool) => {
      setActiveTool(tool);
      if (
        (tool === "fog-reveal" || tool === "fog-reveal-all" || tool === "fog-hide" || tool === "fog-hide-all") &&
        !fogTargetPlayerId &&
        players.length > 0
      ) {
        setFogTargetPlayerId(players[0].userId);
      }
    },
    [fogTargetPlayerId, players]
  );

  const handleFogPaint = useCallback(
    (zone: { x: number; y: number; width: number; height: number }) => {
      if (!selectedMapLevelId) return;

      if (activeTool === "fog-reveal-all") {
        revealFogZoneToAll.mutate({
          fogZoneId: crypto.randomUUID(),
          mapLevelId: selectedMapLevelId,
          previewPlayerId: fogTargetPlayerId,
          ...zone,
        });
      } else if (activeTool === "fog-reveal") {
        if (!fogTargetPlayerId) return;
        revealFogZone.mutate({
          fogZoneId: crypto.randomUUID(),
          playerId: fogTargetPlayerId,
          mapLevelId: selectedMapLevelId,
          ...zone,
        });
      } else if (activeTool === "fog-hide") {
        if (!fogTargetPlayerId) return;
        const overlapping = fogZones.filter(
          (fz) =>
            fz.x < zone.x + zone.width &&
            fz.x + fz.width > zone.x &&
            fz.y < zone.y + zone.height &&
            fz.y + fz.height > zone.y
        );
        if (overlapping.length === 0) return;
        const batch = overlapping.length > 1;
        for (const fz of overlapping) {
          hideFogZone.mutate({
            fogZoneId: fz.id,
            playerId: fogTargetPlayerId,
            mapLevelId: selectedMapLevelId,
            silent: batch,
          });
        }
        if (batch) {
          toast.success(`${overlapping.length} fog zones hidden`);
        }
      } else if (activeTool === "fog-hide-all") {
        const overlapping = fogZones.filter(
          (fz) =>
            fz.x < zone.x + zone.width &&
            fz.x + fz.width > zone.x &&
            fz.y < zone.y + zone.height &&
            fz.y + fz.height > zone.y
        );
        if (overlapping.length === 0) return;
        const batch = overlapping.length > 1;
        for (const fz of overlapping) {
          hideFogZoneToAll.mutate({
            fogZoneId: fz.id,
            mapLevelId: selectedMapLevelId,
            previewPlayerId: fogTargetPlayerId,
            silent: batch,
          });
        }
        if (batch) {
          toast.success(`${overlapping.length} fog zones hidden for all players`);
        }
      }
    },
    [selectedMapLevelId, fogTargetPlayerId, activeTool, revealFogZone, revealFogZoneToAll, hideFogZone, hideFogZoneToAll, fogZones]
  );

  const selectedLevel = mapLevels.find((l) => l.id === selectedMapLevelId);

  return (
    <main className="flex-1 flex flex-col h-full">
      {/* App-level navigation */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-1">
        <Button variant="ghost" size="icon" className="h-7 w-7" asChild aria-label="Go back">
          <Link href={`/campaign/${campaignId}/gm/prep`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <AppBreadcrumb
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: campaign?.name ?? "Campaign", href: `/campaign/${campaignId}/gm/prep` },
            { label: "Maps" },
          ]}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Map className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-xl font-bold text-foreground">Map Hierarchy</h1>
        </div>
        {!isPreviewMode && (
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Create Map Level
          </Button>
        )}
      </div>

      {/* Breadcrumb */}
      {selectedMapLevelId && (
        <div className="px-4 py-2 border-b bg-muted">
          <MapBreadcrumb
            levels={mapLevels}
            selectedId={selectedMapLevelId}
            onSelect={setSelectedMapLevelId}
          />
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Tree */}
        <div className="w-64 border-r overflow-y-auto p-2">
          {isLoading ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="h-8 w-8 text-destructive mb-2" />
              <p className="text-sm text-destructive">Failed to load map levels.</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() =>
                  queryClient.invalidateQueries({
                    queryKey: ["map-levels", campaignId],
                  })
                }
              >
                Retry
              </Button>
            </div>
          ) : (
            <MapHierarchyTree
              levels={mapLevels}
              selectedId={selectedMapLevelId}
              onSelect={setSelectedMapLevelId}
              onRename={!isPreviewMode ? handleRenameLevel : undefined}
            />
          )}
        </div>

        {/* Canvas area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-muted/30">
          {selectedLevel ? (
            <>
              {/* Canvas header with import button */}
              <div className="flex items-center justify-between px-4 py-2 border-b">
                <p className="text-sm font-medium text-foreground">
                  {selectedLevel.name}
                </p>
                <div className="flex items-center gap-2">
                  {!isPreviewMode && (
                    <>
                      <FogToolbar
                        activeTool={activeTool}
                        onToolChange={handleToolChange}
                      />
                      <FogPlayerSelector
                        players={players}
                        selectedPlayerId={fogTargetPlayerId}
                        onPlayerChange={setFogTargetPlayerId}
                        visible={activeTool === "fog-reveal" || activeTool === "fog-hide"}
                      />
                      {activeTool === "fog-reveal-all" && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap" data-testid="fog-reveal-all-label">
                          Revealing to all players
                        </span>
                      )}
                      {activeTool === "fog-hide-all" && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap" data-testid="fog-hide-all-label">
                          Hiding from all players
                        </span>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={enterPreview}
                            disabled={players.length === 0}
                            aria-label="Preview Player View"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Preview Player View
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Preview what a player sees</TooltipContent>
                      </Tooltip>
                      <ImportMapBackgroundButton
                        campaignId={campaignId}
                        mapLevelId={selectedLevel.id}
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Canvas with tokens */}
              <div className="flex-1 overflow-hidden relative">
                {isPreviewMode && previewPlayerId && (
                  <PlayerPreviewBar
                    playerId={previewPlayerId}
                    players={players}
                    onPlayerChange={setPreviewPlayerId}
                    onExit={exitPreview}
                  />
                )}
                {tokensError ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                    <p className="text-sm text-destructive">Failed to load tokens.</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() =>
                        queryClient.invalidateQueries({
                          queryKey: ["tokens", campaignId, selectedMapLevelId],
                        })
                      }
                    >
                      Retry
                    </Button>
                  </div>
                ) : (
                  <MapCanvas
                    mapLevel={selectedLevel}
                    tokens={tokens}
                    interactive={true}
                    viewMode={isPreviewMode ? "preview" : "gm"}
                    playerId={isPreviewMode ? previewPlayerId ?? undefined : undefined}
                    fogZones={fogZones}
                    mapLevels={mapLevels}
                    activeTool={isPreviewMode ? "select" : activeTool}
                    onFogPaint={handleFogPaint}
                    onTokenPlace={handleTokenPlace}
                    onTokenMove={handleTokenMove}
                    onTokenRemove={handleTokenRemove}
                    onLocationNavigate={handleLocationNavigate}
                    onBrokenLinkClick={handleBrokenLinkClick}
                  />
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Map className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Select a map level</p>
                <p className="text-sm mt-1">
                  Choose a level from the tree to view it here.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar - Token Palette (hidden in preview mode) */}
        {selectedLevel && !isPreviewMode && (
          <div className="w-56 border-l overflow-y-auto">
            <TokenPalette />
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <CreateMapLevelDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateLevel}
        isPending={createMapLevel.isPending}
        levels={mapLevels}
      />

      {/* Location Link Dialog */}
      {locationLinkDialog && selectedMapLevelId && (
        <LocationLinkDialog
          open={locationLinkDialog.open}
          onOpenChange={(open) => {
            if (!open) handleLocationLinkCancel();
          }}
          mapLevels={mapLevels}
          currentMapLevelId={selectedMapLevelId}
          onSelect={handleLocationLinkSelect}
          onCancel={handleLocationLinkCancel}
          initialDestinationId={locationLinkDialog.initialDestinationId}
        />
      )}
    </main>
  );
}
