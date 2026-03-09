"use client";

import { useState } from "react";
import { AlertCircle, Link2, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { InvitationLinkDisplay } from "./invitation-link-display";
import { useCampaignInvitation } from "@/hooks/use-campaign-invitation";
import { useCreateInvitation } from "@/hooks/use-create-invitation";
import { useRevokeInvitation } from "@/hooks/use-revoke-invitation";
import { Skeleton } from "@/components/ui/skeleton";

interface InvitationManagerProps {
  campaignId: string;
}

export function InvitationManager({ campaignId }: InvitationManagerProps) {
  const { invitation, isLoading, isError } = useCampaignInvitation(campaignId);
  const createInvitation = useCreateInvitation(campaignId);
  const revokeInvitation = useRevokeInvitation(campaignId);

  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [activeInviteUrl, setActiveInviteUrl] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const handleGenerate = () => {
    setMutationError(null);
    createInvitation.mutate(7, {
      onSuccess: (data) => {
        setActiveInviteUrl(data.inviteUrl);
      },
      onError: () => {
        setMutationError("Failed to generate invitation link. Please try again.");
      },
    });
  };

  const handleRegenerate = () => {
    if (!invitation) return;

    setMutationError(null);
    revokeInvitation.mutate(invitation.id, {
      onSuccess: () => {
        createInvitation.mutate(7, {
          onSuccess: (data) => {
            setActiveInviteUrl(data.inviteUrl);
            setShowRegenerateDialog(false);
          },
          onError: () => {
            setMutationError("Failed to regenerate invitation link. The old link was revoked. Please generate a new one.");
            setShowRegenerateDialog(false);
          },
        });
      },
      onError: () => {
        setMutationError("Failed to revoke the current link. Please try again.");
        setShowRegenerateDialog(false);
      },
    });
  };

  const handleRevoke = () => {
    if (!invitation) return;

    setMutationError(null);
    revokeInvitation.mutate(invitation.id, {
      onSuccess: () => {
        setActiveInviteUrl(null);
        setShowRevokeDialog(false);
      },
      onError: () => {
        setMutationError("Failed to revoke the invitation link. Please try again.");
        setShowRevokeDialog(false);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-4 w-48" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-text-primary">
          Invitation Link
        </h3>
        <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <p className="text-sm text-destructive">
            Failed to load invitation status. Please refresh the page.
          </p>
        </div>
      </div>
    );
  }

  const hasInvitation = invitation !== null;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-text-primary">
        Invitation Link
      </h3>

      {mutationError && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
          <p className="text-sm text-destructive">{mutationError}</p>
        </div>
      )}

      {hasInvitation ? (
        <>
          {activeInviteUrl ? (
            <InvitationLinkDisplay
              inviteUrl={activeInviteUrl}
              createdAt={invitation.createdAt}
              expiresAt={invitation.expiresAt}
            />
          ) : (
            <div className="rounded-md border border-border bg-surface-base px-3 py-2">
              <p className="text-sm text-text-secondary">
                An active invitation link exists but the token cannot be
                recovered after creation. Use{" "}
                <span className="font-medium text-text-primary">
                  Regenerate
                </span>{" "}
                to create a new shareable link.
              </p>
              <div className="mt-1 flex items-center gap-4 text-xs text-text-secondary">
                <span>Created {new Date(invitation.createdAt).toLocaleDateString()}</span>
                {invitation.expiresAt && (
                  <span>Expires {new Date(invitation.expiresAt).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRegenerateDialog(true)}
              disabled={
                revokeInvitation.isPending || createInvitation.isPending
              }
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Regenerate
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRevokeDialog(true)}
              disabled={revokeInvitation.isPending}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Revoke
            </Button>
          </div>
        </>
      ) : (
        <div className="space-y-3">
          {activeInviteUrl && (
            <InvitationLinkDisplay
              inviteUrl={activeInviteUrl}
              createdAt={new Date().toISOString()}
              expiresAt={
                new Date(
                  Date.now() + 7 * 24 * 60 * 60 * 1000
                ).toISOString()
              }
            />
          )}
          {!activeInviteUrl && (
            <p className="text-sm text-text-secondary">
              No invitation link generated yet. Create one to invite players to
              your campaign.
            </p>
          )}
          <Button
            onClick={handleGenerate}
            disabled={createInvitation.isPending}
            className="bg-accent-primary hover:bg-accent-primary/90"
            size="sm"
          >
            <Link2 className="mr-1.5 h-3.5 w-3.5" />
            {createInvitation.isPending
              ? "Generating..."
              : "Generate Invitation Link"}
          </Button>
        </div>
      )}

      {/* Regenerate Confirmation Dialog */}
      <AlertDialog
        open={showRegenerateDialog}
        onOpenChange={setShowRegenerateDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate invitation link?</AlertDialogTitle>
            <AlertDialogDescription>
              Regenerating will invalidate the current link. Any player who
              hasn&apos;t joined yet will need the new link.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              onClick={handleRegenerate}
              disabled={
                revokeInvitation.isPending || createInvitation.isPending
              }
              className="bg-accent-primary hover:bg-accent-primary/90"
            >
              {revokeInvitation.isPending || createInvitation.isPending
                ? "Regenerating..."
                : "Regenerate"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke Confirmation Dialog */}
      <AlertDialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke invitation link?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently invalidate the invitation link. Players who
              haven&apos;t joined yet will no longer be able to use it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleRevoke}
              disabled={revokeInvitation.isPending}
            >
              {revokeInvitation.isPending ? "Revoking..." : "Revoke Link"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
