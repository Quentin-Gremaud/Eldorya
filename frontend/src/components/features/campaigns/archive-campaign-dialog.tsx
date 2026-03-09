"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useArchiveCampaign } from "@/hooks/use-archive-campaign";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface ArchiveCampaignDialogProps {
  campaignId: string;
  campaignName: string;
  isProUser: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ArchiveCampaignDialog({
  campaignId,
  campaignName,
  isProUser,
  open,
  onOpenChange,
}: ArchiveCampaignDialogProps) {
  const router = useRouter();
  const { mutate: archiveCampaign, isPending } = useArchiveCampaign(campaignId);

  const handleConfirm = () => {
    archiveCampaign(undefined, {
      onSuccess: () => {
        onOpenChange(false);
        toast.success(`"${campaignName}" has been archived.`);
        router.push("/dashboard");
      },
      onError: () => {
        toast.error("Failed to archive campaign. Please try again.");
      },
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={isPending ? undefined : onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Archive Campaign</AlertDialogTitle>
          <AlertDialogDescription>
            Archiving will make this campaign read-only — no new sessions can be
            launched, but all history is preserved.
          </AlertDialogDescription>
          {!isProUser && (
            <p className="text-sm font-medium text-destructive mt-2">
              This action is irreversible for free-tier accounts.
            </p>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? "Archiving..." : "Archive Campaign"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
