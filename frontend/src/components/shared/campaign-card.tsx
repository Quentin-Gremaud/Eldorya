"use client";

import { KeyboardEvent } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Sword, Users, Calendar } from "lucide-react";
import { formatRelativeDate } from "@/lib/utils";
export interface CampaignCardData {
  id: string;
  name: string;
  description: string | null;
  coverImageUrl: string | null;
  status: string;
  role: "gm" | "player";
  playerCount: number;
  lastSessionDate: string | null;
  gmDisplayName?: string;
}

interface CampaignCardProps {
  campaign: CampaignCardData;
  onClick?: () => void;
}

function isValidHttpUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function CampaignCard({ campaign, onClick }: CampaignCardProps) {
  const RoleIcon = campaign.role === "gm" ? Crown : Sword;
  const roleLabel = campaign.role === "gm" ? "GM" : "Player";

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (onClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick();
    }
  };

  const safeImageUrl =
    campaign.coverImageUrl && isValidHttpUrl(campaign.coverImageUrl)
      ? campaign.coverImageUrl
      : null;

  return (
    <Card
      className={`w-64 shrink-0 overflow-hidden bg-surface-elevated transition-transform hover:scale-[1.02] ${onClick ? "cursor-pointer" : ""} ${campaign.status === "archived" ? "opacity-75" : ""}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`Campaign: ${campaign.name}`}
    >
      {safeImageUrl ? (
        <div
          className="h-36 w-full bg-cover bg-center"
          style={{ backgroundImage: `url(${safeImageUrl})` }}
          role="img"
          aria-label={`${campaign.name} cover`}
        />
      ) : (
        <div className="h-36 w-full bg-gradient-to-br from-accent-primary/30 to-accent-primary/10" aria-hidden="true" />
      )}
      <CardContent className="space-y-2 p-4">
        <div className="flex items-center justify-between">
          <h3 className="truncate text-sm font-semibold text-text-primary">
            {campaign.name}
          </h3>
          <div className="ml-2 flex shrink-0 gap-1">
            {campaign.status === "active" && (
              <Badge className="bg-accent-primary/20 text-accent-primary border-accent-primary/30 text-xs">
                Active
              </Badge>
            )}
            {campaign.status === "archived" && (
              <Badge variant="secondary" className="text-xs text-muted-foreground">
                Archived
              </Badge>
            )}
            <Badge variant="outline">
              <RoleIcon className="mr-1 h-3 w-3" />
              {roleLabel}
            </Badge>
          </div>
        </div>
        {campaign.description && (
          <p className="line-clamp-2 text-xs text-text-secondary">
            {campaign.description}
          </p>
        )}
        <div className="flex items-center gap-3 text-xs text-text-secondary">
          {campaign.role === "player" && campaign.gmDisplayName ? (
            <span className="flex items-center gap-1">
              <Crown className="h-3 w-3" />
              GM: {campaign.gmDisplayName}
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {campaign.playerCount}
            </span>
          )}
          {campaign.lastSessionDate && (() => {
            const relative = formatRelativeDate(campaign.lastSessionDate);
            if (!relative) return null;
            return (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {relative}
              </span>
            );
          })()}
        </div>
      </CardContent>
    </Card>
  );
}
