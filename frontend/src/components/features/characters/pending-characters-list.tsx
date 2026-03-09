"use client";

import { useApproveCharacter } from "@/hooks/use-approve-character";
import { useRejectCharacter } from "@/hooks/use-reject-character";
import { PendingCharacterCard } from "./pending-character-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { PendingCharacterDetail } from "@/types/api";

interface PendingCharactersListProps {
  campaignId: string;
  characters: PendingCharacterDetail[];
  isLoading: boolean;
  isError: boolean;
}

export function PendingCharactersList({
  campaignId,
  characters: pendingCharacters,
  isLoading,
  isError,
}: PendingCharactersListProps) {
  const approveMutation = useApproveCharacter(campaignId);
  const rejectMutation = useRejectCharacter(campaignId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-muted-foreground">
        Failed to load pending characters.
      </p>
    );
  }

  if (pendingCharacters.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No characters pending review.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {pendingCharacters.map((character) => (
        <PendingCharacterCard
          key={character.id}
          character={character}
          onApprove={(id) => approveMutation.mutate(id)}
          onReject={(id, reason) => rejectMutation.mutate({ characterId: id, reason })}
          isApproving={
            approveMutation.isPending &&
            approveMutation.variables === character.id
          }
          isRejecting={
            rejectMutation.isPending &&
            rejectMutation.variables?.characterId === character.id
          }
        />
      ))}
    </div>
  );
}
