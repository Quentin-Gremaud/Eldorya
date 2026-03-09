"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import type { Inventory, EquipmentSlotType } from "@/types/api";
import { toast } from "sonner";

interface RemoveItemInput {
  itemId: string;
}

export function useRemoveItemFromInventory(
  campaignId: string,
  characterId: string
) {
  const apiFetch = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RemoveItemInput) =>
      apiFetch(
        `/api/campaigns/${campaignId}/characters/${characterId}/inventory/remove-item`,
        {
          method: "POST",
          body: JSON.stringify({
            ...input,
            commandId: crypto.randomUUID(),
          }),
        }
      ),

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
        const removedItem = previousInventory.items.find(
          (i) => i.id === input.itemId
        );
        const updatedItems = previousInventory.items.filter(
          (i) => i.id !== input.itemId
        );
        const updatedBackpack = previousInventory.backpackItems.filter(
          (i) => i.id !== input.itemId
        );
        const updatedSlots = { ...previousInventory.equipmentSlots };
        if (removedItem?.equippedSlot) {
          updatedSlots[removedItem.equippedSlot as EquipmentSlotType] = null;
        }
        const newWeight = removedItem
          ? previousInventory.currentWeight - removedItem.weight
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
      toast.error("Failed to remove item");
    },

    onSuccess: () => {
      toast.success("Item removed from inventory");
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
