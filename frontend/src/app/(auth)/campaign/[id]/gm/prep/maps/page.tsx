"use client";

import { use, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useMapLevels } from "@/hooks/use-map-levels";
import { useCreateMapLevel } from "@/hooks/use-create-map-level";
import { useRenameMapLevel } from "@/hooks/use-rename-map-level";
import { MapHierarchyTree } from "@/components/features/maps/map-hierarchy-tree";
import { MapBreadcrumb } from "@/components/features/maps/map-breadcrumb";
import { CreateMapLevelDialog } from "@/components/features/maps/create-map-level-dialog";
import { ImportMapBackgroundButton } from "@/components/features/maps/import-map-background-button";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertCircle, Plus, Map, Upload } from "lucide-react";

export default function GmPrepMapsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: campaignId } = use(params);
  const queryClient = useQueryClient();
  const { mapLevels, isLoading, isError } = useMapLevels(campaignId);
  const createMapLevel = useCreateMapLevel(campaignId);
  const renameMapLevel = useRenameMapLevel(campaignId);

  const [selectedMapLevelId, setSelectedMapLevelId] = useState<string | null>(
    null
  );
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

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

  const selectedLevel = mapLevels.find((l) => l.id === selectedMapLevelId);

  return (
    <main className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Map className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-xl font-bold text-foreground">Map Hierarchy</h1>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Create Map Level
        </Button>
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
              onRename={handleRenameLevel}
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
                <ImportMapBackgroundButton
                  campaignId={campaignId}
                  mapLevelId={selectedLevel.id}
                />
              </div>

              {/* Background display */}
              <div className="flex-1 flex items-center justify-center overflow-hidden relative">
                {selectedLevel.backgroundImageUrl ? (
                  <img
                    src={selectedLevel.backgroundImageUrl}
                    alt={`${selectedLevel.name} background`}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Upload className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">No background image</p>
                    <p className="text-sm mt-1">
                      Click &quot;Import Background&quot; to add a map image.
                    </p>
                  </div>
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
      </div>

      {/* Create Dialog */}
      <CreateMapLevelDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateLevel}
        isPending={createMapLevel.isPending}
        levels={mapLevels}
      />
    </main>
  );
}
