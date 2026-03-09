"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import type { Inventory, EquipmentSlotType } from "@/types/api";
import { toast } from "sonner";

interface EquipItemInput {
  itemId: string;
  slotType: string;
}

export function useEquipItem(characterId: string) {
  const apiFetch = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: EquipItemInput) =>
      apiFetch(`/api/characters/${characterId}/inventory/equip`, {
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
          const displacedItem = previousInventory.equipmentSlots[input.slotType as EquipmentSlotType];
          const nextPosition = Math.max(
            0,
            ...previousInventory.backpackItems.map((i) => i.position + 1)
          );

          let updatedItems = previousInventory.items.map((i) =>
            i.id === input.itemId
              ? { ...i, equippedSlot: input.slotType, position: null }
              : i
          );

          let updatedBackpack = previousInventory.backpackItems.filter(
            (i) => i.id !== input.itemId
          );

          // If the slot was occupied, move the displaced item back to backpack
          if (displacedItem) {
            updatedItems = updatedItems.map((i) =>
              i.id === displacedItem.id
                ? { ...i, equippedSlot: null, position: nextPosition }
                : i
            );
            updatedBackpack = [
              ...updatedBackpack,
              {
                id: displacedItem.id,
                name: displacedItem.name,
                description: displacedItem.description,
                weight: displacedItem.weight,
                slotType: displacedItem.slotType,
                statModifiers: displacedItem.statModifiers,
                position: nextPosition,
              },
            ];
          }

          const updatedSlots = {
            ...previousInventory.equipmentSlots,
            [input.slotType]: item,
          };

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
      toast.error("Failed to equip item");
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
