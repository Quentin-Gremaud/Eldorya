"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAccountDeletion } from "@/hooks/use-account-deletion";

export function DeleteAccountSection() {
  const [confirmText, setConfirmText] = useState("");
  const [open, setOpen] = useState(false);

  const {
    activeCampaigns,
    isLoadingCampaigns,
    deleteAccount,
    isDeleting,
    deleteError,
  } = useAccountDeletion();

  const isConfirmed = confirmText === "DELETE";
  const hasActiveCampaigns = activeCampaigns.count > 0;

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setConfirmText("");
    }
  };

  return (
    <section className="rounded-lg border border-destructive p-6">
      <h2 className="text-xl font-semibold text-text-primary">Danger Zone</h2>

      <p className="mt-2 text-sm text-text-secondary">
        Deleting your account is permanent and cannot be undone. All your
        personal data will be permanently erased through crypto-shredding, your
        authentication will be deactivated, and you will no longer be able to
        log in.
      </p>

      {!isLoadingCampaigns && hasActiveCampaigns && (
        <div className="mt-4 rounded-md border border-warning bg-warning/10 p-4">
          <p className="text-sm font-medium text-text-primary">
            You are the Game Master of {activeCampaigns.count} active
            campaign{activeCampaigns.count > 1 ? "s" : ""}:
          </p>
          <ul className="mt-1 list-inside list-disc text-sm text-text-secondary">
            {activeCampaigns.campaigns.map((campaign) => (
              <li key={campaign.id}>{campaign.name}</li>
            ))}
          </ul>
          <p className="mt-2 text-sm font-medium text-text-primary">
            These campaigns will become permanently inaccessible if you delete
            your account.
          </p>
        </div>
      )}

      {deleteError && (
        <p className="mt-4 text-sm text-danger">
          An error occurred while deleting your account. Please try again.
        </p>
      )}

      <div className="mt-6">
        <AlertDialog open={open} onOpenChange={handleOpenChange}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Delete My Account</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action will permanently erase all your personal data through
                crypto-shredding. Your encrypted data in the event store will
                become permanently unreadable, your account will be deactivated,
                and all your data will be lost. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="mt-2">
              <label
                htmlFor="confirm-delete"
                className="text-sm text-text-secondary"
              >
                Type <strong>DELETE</strong> to confirm:
              </label>
              <Input
                id="confirm-delete"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="mt-1"
                autoComplete="off"
              />
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={!isConfirmed || isDeleting}
                onClick={(e) => {
                  e.preventDefault();
                  deleteAccount();
                }}
              >
                {isDeleting ? "Deleting..." : "Delete My Account"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </section>
  );
}
