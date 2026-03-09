"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useInventory } from "@/hooks/use-inventory";
import { useAddItemToInventory } from "@/hooks/use-add-item-to-inventory";
import { useRemoveItemFromInventory } from "@/hooks/use-remove-item-from-inventory";
import { useEquipItem } from "@/hooks/use-equip-item";
import { useUnequipItem } from "@/hooks/use-unequip-item";
import { useMoveItem } from "@/hooks/use-move-item";
import { useDropItem } from "@/hooks/use-drop-item";
import { useModifyMaxCapacity } from "@/hooks/use-modify-max-capacity";
import type { EquipmentSlotType } from "@/types/api";
import { InventoryGrid } from "./inventory-grid";
import { AddItemDialog } from "./add-item-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Package, AlertCircle, Plus, Trash2 } from "lucide-react";

interface GmInventoryEditorProps {
  campaignId: string;
  characterId: string;
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

export function GmInventoryEditor({
  campaignId,
  characterId,
}: GmInventoryEditorProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addDialogSlotType, setAddDialogSlotType] = useState<EquipmentSlotType | undefined>(undefined);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { inventory, isLoading, isError } = useInventory(characterId);
  const addItem = useAddItemToInventory(campaignId, characterId);
  const removeItem = useRemoveItemFromInventory(campaignId, characterId);
  const equipItem = useEquipItem(characterId);
  const unequipItem = useUnequipItem(characterId);
  const moveItem = useMoveItem(characterId);
  const dropItem = useDropItem(characterId);
  const modifyMaxCapacity = useModifyMaxCapacity(campaignId, characterId);

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Inventory</h3>
        <div className="flex gap-2">
          {selectedItemId && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                removeItem.mutate({ itemId: selectedItemId });
                setSelectedItemId(null);
              }}
              disabled={removeItem.isPending}
            >
              <Trash2 className="size-4 mr-1" />
              Remove
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setAddDialogSlotType(undefined);
              setAddDialogOpen(true);
            }}
          >
            <Plus className="size-4 mr-1" />
            Add Item
          </Button>
        </div>
      </div>

      <InventoryGrid
        inventory={inventory}
        isEditable={true}
        onEquipItem={(itemId, slotType) =>
          equipItem.mutate({ itemId, slotType })
        }
        onUnequipItem={(itemId) => unequipItem.mutate({ itemId })}
        onMoveItem={(itemId, toPosition) =>
          moveItem.mutate({ itemId, toPosition })
        }
        onDropItem={(itemId) => dropItem.mutate({ itemId })}
        onItemSelect={setSelectedItemId}
        selectedItemId={selectedItemId}
        onEmptySlotClick={(slotType) => {
          setAddDialogSlotType(slotType);
          setAddDialogOpen(true);
        }}
        onMaxCapacityChange={(newMaxCapacity) =>
          modifyMaxCapacity.mutate({ newMaxCapacity })
        }
      />

      <AddItemDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        defaultSlotType={addDialogSlotType}
        onSubmit={(data) => {
          addItem.mutate({
            itemId: crypto.randomUUID(),
            name: data.name,
            description: data.description,
            weight: data.weight,
            slotType: data.slotType,
          });
        }}
        isPending={addItem.isPending}
      />
    </div>
  );
}
