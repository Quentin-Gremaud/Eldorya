"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import type { Inventory, BackpackItem } from "@/types/api";
import { toast } from "sonner";

export interface AddItemInput {
  itemId: string;
  name: string;
  description?: string;
  weight: number;
  slotType: string;
  statModifiers?: Record<string, number>;
}

export function useAddItemToInventory(campaignId: string, characterId: string) {
  const apiFetch = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AddItemInput) =>
      apiFetch(
        `/api/campaigns/${campaignId}/characters/${characterId}/inventory/add-item`,
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
        const maxPosition = previousInventory.backpackItems.reduce(
          (max, item) => Math.max(max, item.position),
          -1
        );
        const newPosition = maxPosition + 1;

        const newBackpackItem: BackpackItem = {
          id: input.itemId,
          name: input.name,
          description: input.description ?? "",
          weight: input.weight,
          slotType: input.slotType,
          statModifiers: input.statModifiers ?? {},
          position: newPosition,
        };

        const newInventoryItem = {
          ...newBackpackItem,
          position: newPosition as number | null,
          equippedSlot: null as string | null,
        };

        queryClient.setQueryData<Inventory>(
          ["characters", characterId, "inventory"],
          {
            ...previousInventory,
            backpackItems: [...previousInventory.backpackItems, newBackpackItem],
            items: [...previousInventory.items, newInventoryItem],
            currentWeight: previousInventory.currentWeight + input.weight,
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
      toast.error("Failed to add item");
    },

    onSuccess: () => {
      toast.success("Item added to inventory");
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
