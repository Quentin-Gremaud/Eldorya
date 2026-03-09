"use client";

import { useApproveCharacterModification } from "@/hooks/use-approve-character-modification";
import { useRejectCharacterModification } from "@/hooks/use-reject-character-modification";
import { CharacterModificationReviewCard } from "./character-modification-review-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { PendingModification } from "@/hooks/use-pending-modifications";

interface PendingModificationsListProps {
  campaignId: string;
  modifications: PendingModification[];
  isLoading: boolean;
  isError: boolean;
}

export function PendingModificationsList({
  campaignId,
  modifications,
  isLoading,
  isError,
}: PendingModificationsListProps) {
  const approveMutation = useApproveCharacterModification(campaignId);
  const rejectMutation = useRejectCharacterModification(campaignId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-muted-foreground">
        Failed to load modification requests.
      </p>
    );
  }

  if (modifications.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {modifications.map((mod) => (
        <CharacterModificationReviewCard
          key={mod.id}
          modification={mod}
          onApprove={(id) => approveMutation.mutate(id)}
          onReject={(id, reason) =>
            rejectMutation.mutate({ characterId: id, reason })
          }
          isApproving={
            approveMutation.isPending &&
            approveMutation.variables === mod.id
          }
          isRejecting={
            rejectMutation.isPending &&
            rejectMutation.variables?.characterId === mod.id
          }
        />
      ))}
    </div>
  );
}
