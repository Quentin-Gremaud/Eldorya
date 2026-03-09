"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { useCreateCampaign } from "@/hooks/use-create-campaign";

const createCampaignSchema = z.object({
  name: z
    .string()
    .min(1, "Campaign name is required")
    .max(100, "Campaign name cannot exceed 100 characters"),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
});

type CreateCampaignFormData = z.infer<typeof createCampaignSchema>;

interface CreateCampaignFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCampaignForm({
  open,
  onOpenChange,
}: CreateCampaignFormProps) {
  const createCampaign = useCreateCampaign();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCampaignFormData>({
    resolver: zodResolver(createCampaignSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = (data: CreateCampaignFormData) => {
    const id = crypto.randomUUID();
    createCampaign.mutate(
      {
        id,
        name: data.name,
        description: data.description || undefined,
      },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
      }
    );
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
          <DialogTitle>Create a new campaign</DialogTitle>
          <DialogDescription>
            Set up your campaign with a name and optional description.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="campaign-name">Campaign Name</Label>
            <Input
              id="campaign-name"
              placeholder="Enter campaign name"
              {...register("name")}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "campaign-name-error" : undefined}
            />
            {errors.name && (
              <p
                id="campaign-name-error"
                className="text-sm text-destructive"
                role="alert"
              >
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="campaign-description">
              Description{" "}
              <span className="text-text-secondary">(optional)</span>
            </Label>
            <textarea
              id="campaign-description"
              placeholder="Describe your campaign"
              rows={3}
              className="flex w-full rounded-md border border-border bg-surface-base px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/20 focus-visible:border-accent-primary disabled:cursor-not-allowed disabled:opacity-50"
              {...register("description")}
              aria-invalid={!!errors.description}
              aria-describedby={errors.description ? "campaign-description-error" : undefined}
            />
            {errors.description && (
              <p
                id="campaign-description-error"
                className="text-sm text-destructive"
                role="alert"
              >
                {errors.description.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createCampaign.isPending}
              className="bg-accent-primary hover:bg-accent-primary/90"
            >
              {createCampaign.isPending ? "Creating..." : "Create Campaign"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
