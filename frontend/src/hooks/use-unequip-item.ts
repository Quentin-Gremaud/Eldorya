"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import type { Inventory, EquipmentSlotType } from "@/types/api";
import { toast } from "sonner";

interface UnequipItemInput {
  itemId: string;
}

export function useUnequipItem(characterId: string) {
  const apiFetch = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UnequipItemInput) =>
      apiFetch(`/api/characters/${characterId}/inventory/unequip`, {
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
        const item = previousInventory.items.find(
          (i) => i.id === input.itemId
        );
        if (item) {
          const nextPosition = Math.max(
            0,
            ...previousInventory.backpackItems.map((i) => i.position + 1)
          );
          const updatedSlots = { ...previousInventory.equipmentSlots };
          if (item.equippedSlot) {
            updatedSlots[item.equippedSlot as EquipmentSlotType] = null;
          }
          const updatedItems = previousInventory.items.map((i) =>
            i.id === input.itemId
              ? { ...i, equippedSlot: null, position: nextPosition }
              : i
          );
          const updatedBackpack = [
            ...previousInventory.backpackItems,
            {
              id: item.id,
              name: item.name,
              description: item.description,
              weight: item.weight,
              slotType: item.slotType,
              statModifiers: item.statModifiers,
              position: nextPosition,
            },
          ];

          queryClient.setQueryData<Inventory>(
            ["characters", characterId, "inventory"],
            {
              ...previousInventory,
              equipmentSlots: updatedSlots,
              backpackItems: updatedBackpack,
              items: updatedItems,
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
      toast.error("Failed to unequip item");
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
