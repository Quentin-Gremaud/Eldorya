"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import type { Inventory } from "@/types/api";
import { toast } from "sonner";

interface MoveItemInput {
  itemId: string;
  toPosition: number;
}

export function useMoveItem(characterId: string) {
  const apiFetch = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: MoveItemInput) =>
      apiFetch(`/api/characters/${characterId}/inventory/move`, {
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
        const movingItem = previousInventory.backpackItems.find(
          (i) => i.id === input.itemId
        );
        const targetItem = previousInventory.backpackItems.find(
          (i) => i.position === input.toPosition
        );

        if (movingItem) {
          const updatedBackpack = previousInventory.backpackItems.map((i) => {
            if (i.id === input.itemId) {
              return { ...i, position: input.toPosition };
            }
            if (targetItem && i.id === targetItem.id) {
              return { ...i, position: movingItem.position };
            }
            return i;
          });

          queryClient.setQueryData<Inventory>(
            ["characters", characterId, "inventory"],
            {
              ...previousInventory,
              backpackItems: updatedBackpack,
            }
          );
        }
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
      toast.error("Failed to move item");
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
