"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import type { Inventory, EquipmentSlotType } from "@/types/api";
import { toast } from "sonner";

interface DropItemInput {
  itemId: string;
}

export function useDropItem(characterId: string) {
  const apiFetch = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: DropItemInput) =>
      apiFetch(`/api/characters/${characterId}/inventory/drop`, {
        method: "POST",
        body: JSON.stringify({
          ...input,
          commandId: crypto.randomUUID(),
        }),
      }),

    onMutate: async (input) => {
      await queryClient.cancelQueries({
        queryKey: ["characters", characterId, "inventory"],
      });

      const previousInventory = queryClient.getQueryData<Inventory>([
        "characters",
        characterId,
        "inventory",
      ]);

      if (previousInventory) {
        const droppedItem = previousInventory.items.find(
          (i) => i.id === input.itemId
        );
        const updatedItems = previousInventory.items.filter(
          (i) => i.id !== input.itemId
        );
        const updatedBackpack = previousInventory.backpackItems.filter(
          (i) => i.id !== input.itemId
        );
        const updatedSlots = { ...previousInventory.equipmentSlots };
        if (droppedItem?.equippedSlot) {
          updatedSlots[droppedItem.equippedSlot as EquipmentSlotType] = null;
        }
        const newWeight = droppedItem
          ? previousInventory.currentWeight - droppedItem.weight
          : previousInventory.currentWeight;

        queryClient.setQueryData<Inventory>(
          ["characters", characterId, "inventory"],
          {
            ...previousInventory,
            equipmentSlots: updatedSlots,
            backpackItems: updatedBackpack,
            items: updatedItems,
            currentWeight: newWeight,
          }
        );
      }

      return { previousInventory };
    },

    onError: (_err, _input, context) => {
      if (context?.previousInventory) {
        queryClient.setQueryData(
          ["characters", characterId, "inventory"],
          context.previousInventory
        );
      }
      toast.error("Failed to drop item");
    },

    onSuccess: () => {
      toast.success("Item dropped");
    },

    onSettled: () => {
      setTimeout(() => {
        void queryClient.invalidateQueries({
          queryKey: ["characters", characterId, "inventory"],
        });
      }, 1500);
    },
  });
}
