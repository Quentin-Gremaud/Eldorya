"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { GMCharacterCard } from "./gm-character-card";
import { useCampaignCharacters } from "@/hooks/use-campaign-characters";

interface CampaignCharactersListProps {
  campaignId: string;
}

export function CampaignCharactersList({
  campaignId,
}: CampaignCharactersListProps) {
  const { characters, isLoading, isError } = useCampaignCharacters(campaignId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-red-500">
        Failed to load characters. Please try again.
      </p>
    );
  }

  if (characters.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No approved characters in this campaign
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {characters.map((character) => (
        <GMCharacterCard
          key={character.id}
          campaignId={campaignId}
          character={character}
        />
      ))}
    </div>
  );
}
