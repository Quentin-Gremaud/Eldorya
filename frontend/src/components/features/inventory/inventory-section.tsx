"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useInventory } from "@/hooks/use-inventory";
import { useEquipItem } from "@/hooks/use-equip-item";
import { useUnequipItem } from "@/hooks/use-unequip-item";
import { useMoveItem } from "@/hooks/use-move-item";
import { useDropItem } from "@/hooks/use-drop-item";
import { InventoryGrid } from "./inventory-grid";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Package, AlertCircle } from "lucide-react";

interface InventorySectionProps {
  characterId: string;
  isEditable: boolean;
}

function InventorySkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-24" />
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-3 w-full rounded-full" />
    </div>
  );
}

export function InventorySection({
  characterId,
  isEditable,
}: InventorySectionProps) {
  const queryClient = useQueryClient();
  const { inventory, isLoading, isError } = useInventory(characterId);
  const equipItem = useEquipItem(characterId);
  const unequipItem = useUnequipItem(characterId);
  const moveItem = useMoveItem(characterId);
  const dropItem = useDropItem(characterId);

  if (isLoading) {
    return <InventorySkeleton />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <AlertCircle className="mb-2 h-8 w-8 text-danger" />
        <p className="text-sm text-text-muted">Failed to load inventory.</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() =>
            void queryClient.invalidateQueries({
              queryKey: ["characters", characterId, "inventory"],
            })
          }
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!inventory) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Package className="mb-2 h-8 w-8 text-text-muted" />
        <p className="text-sm text-text-muted">No inventory yet.</p>
      </div>
    );
  }

  return (
    <InventoryGrid
      inventory={inventory}
      isEditable={isEditable}
      onEquipItem={(itemId, slotType) =>
        equipItem.mutate({ itemId, slotType })
      }
      onUnequipItem={(itemId) => unequipItem.mutate({ itemId })}
      onMoveItem={(itemId, toPosition) =>
        moveItem.mutate({ itemId, toPosition })
      }
      onDropItem={(itemId) => dropItem.mutate({ itemId })}
    />
  );
}
