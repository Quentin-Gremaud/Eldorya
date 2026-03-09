"use client";

import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import type { MapLevel } from "@/types/api";

const createMapLevelSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required.")
    .max(100, "Name must be 100 characters or fewer.")
    .transform((v) => v.trim()),
  parentId: z.string().optional(),
});

type CreateMapLevelFormData = z.infer<typeof createMapLevelSchema>;

interface CreateMapLevelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; parentId?: string }) => void;
  isPending: boolean;
  levels: MapLevel[];
}

export function CreateMapLevelDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  levels,
}: CreateMapLevelDialogProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateMapLevelFormData>({
    resolver: zodResolver(createMapLevelSchema),
    defaultValues: { name: "", parentId: undefined },
  });

  const onFormSubmit = (data: CreateMapLevelFormData) => {
    onSubmit({
      name: data.name,
      parentId: data.parentId,
    });
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      reset();
    }
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Map Level</DialogTitle>
          <DialogDescription>
            Add a new level to your map hierarchy.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="map-level-name">Name</Label>
            <Input
              id="map-level-name"
              {...register("name")}
              placeholder="e.g., World, Continent, City..."
              maxLength={100}
              autoFocus
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="map-level-parent">Parent Level (optional)</Label>
            <Controller
              name="parentId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ?? ""}
                  onValueChange={(value) =>
                    field.onChange(value === "none" ? undefined : value)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="None (root level)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (root level)</SelectItem>
                    {levels.map((level) => (
                      <SelectItem key={level.id} value={level.id}>
                        {"  ".repeat(level.depth)}{level.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create Level"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
