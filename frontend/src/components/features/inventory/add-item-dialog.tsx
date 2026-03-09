"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const SLOT_TYPES = [
  { value: "head", label: "Head" },
  { value: "torso", label: "Torso" },
  { value: "hands", label: "Hands" },
  { value: "legs", label: "Legs" },
  { value: "feet", label: "Feet" },
  { value: "ring1", label: "Ring 1" },
  { value: "ring2", label: "Ring 2" },
  { value: "weapon_shield", label: "Weapon / Shield" },
] as const;

const addItemSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(1000).optional(),
  weight: z.number().min(0).max(999),
  slotType: z.enum([
    "head",
    "torso",
    "hands",
    "legs",
    "feet",
    "ring1",
    "ring2",
    "weapon_shield",
  ]),
});

type AddItemFormData = z.infer<typeof addItemSchema>;

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AddItemFormData) => void;
  isPending: boolean;
  defaultSlotType?: AddItemFormData["slotType"];
}

export function AddItemDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  defaultSlotType,
}: AddItemDialogProps) {
  const slotType = defaultSlotType ?? "hands";
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<AddItemFormData>({
    resolver: zodResolver(addItemSchema),
    defaultValues: {
      name: "",
      description: "",
      weight: 0,
      slotType,
    },
  });

  useEffect(() => {
    if (open) {
      reset({ name: "", description: "", weight: 0, slotType });
    }
  }, [open, slotType, reset]);

  const handleFormSubmit = (data: AddItemFormData) => {
    onSubmit(data);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Item to Inventory</DialogTitle>
          <DialogDescription>
            Add a new item to the player&apos;s inventory.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Item name"
            />
            {errors.name && (
              <p className="text-sm text-danger">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Item description (optional)"
              rows={2}
            />
            {errors.description && (
              <p className="text-sm text-danger">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight">Weight</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                {...register("weight", { valueAsNumber: true })}
              />
              {errors.weight && (
                <p className="text-sm text-danger">{errors.weight.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slotType">Slot Type</Label>
              <Select
                defaultValue={slotType}
                onValueChange={(value) =>
                  setValue("slotType", value as AddItemFormData["slotType"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SLOT_TYPES.map((slot) => (
                    <SelectItem key={slot.value} value={slot.value}>
                      {slot.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.slotType && (
                <p className="text-sm text-danger">{errors.slotType.message}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Adding..." : "Add Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
