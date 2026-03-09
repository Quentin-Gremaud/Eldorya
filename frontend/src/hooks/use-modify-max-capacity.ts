"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import type { Inventory } from "@/types/api";
import { toast } from "sonner";

interface ModifyMaxCapacityInput {
  newMaxCapacity: number;
}

export function useModifyMaxCapacity(
  campaignId: string,
  characterId: string
) {
  const apiFetch = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ModifyMaxCapacityInput) =>
      apiFetch(
        `/api/campaigns/${campaignId}/characters/${characterId}/inventory/modify-max-capacity`,
        {
          method: "POST",
          body: JSON.stringify({
            newMaxCapacity: input.newMaxCapacity,
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
        queryClient.setQueryData<Inventory>(
          ["characters", characterId, "inventory"],
          {
            ...previousInventory,
            maxCapacity: input.newMaxCapacity,
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
      toast.error("Failed to modify max capacity");
    },

    onSuccess: () => {
      toast.success("Max capacity updated");
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
