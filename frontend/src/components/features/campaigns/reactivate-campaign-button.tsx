"use client";

import { toast } from "sonner";
import { useReactivateCampaign } from "@/hooks/use-reactivate-campaign";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

interface ReactivateCampaignButtonProps {
  campaignId: string;
}

export function ReactivateCampaignButton({
  campaignId,
}: ReactivateCampaignButtonProps) {
  const { mutate: reactivate, isPending } =
    useReactivateCampaign(campaignId);

  const handleClick = () => {
    reactivate(undefined, {
      onSuccess: () => {
        toast.success("Campaign reactivated successfully.");
      },
      onError: () => {
        toast.error("Failed to reactivate campaign. Please try again.");
      },
    });
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isPending}
    >
      <RotateCcw className="mr-2 h-4 w-4" />
      {isPending ? "Reactivating..." : "Reactivate Campaign"}
    </Button>
  );
}
