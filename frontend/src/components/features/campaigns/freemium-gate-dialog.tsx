"use client";

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

interface FreemiumGateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FreemiumGateDialog({
  open,
  onOpenChange,
}: FreemiumGateDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Campaign limit reached</AlertDialogTitle>
          <AlertDialogDescription>
            You&apos;ve reached the 2-campaign limit for free accounts.
            Archive an existing campaign to create a new one, or upgrade
            to Pro for unlimited campaigns.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              // TODO: Navigate to campaign management for archival
            }}
          >
            Archive a Campaign
          </Button>
          <Button
            variant="outline"
            disabled
            title="Coming soon — Pro subscriptions will be available in a future update"
            aria-disabled="true"
          >
            Upgrade to Pro (Coming soon)
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
