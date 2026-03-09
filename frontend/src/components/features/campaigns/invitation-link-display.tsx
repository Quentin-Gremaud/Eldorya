"use client";

import { Check, Copy, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";

interface InvitationLinkDisplayProps {
  inviteUrl: string;
  createdAt: string;
  expiresAt: string | null;
}

export function InvitationLinkDisplay({
  inviteUrl,
  createdAt,
  expiresAt,
}: InvitationLinkDisplayProps) {
  const { copy, copied } = useCopyToClipboard();

  const createdDate = new Date(createdAt);
  const expiresDate = expiresAt ? new Date(expiresAt) : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex-1 overflow-hidden rounded-md border border-border bg-surface-base px-3 py-2">
          <p
            className="truncate text-sm text-text-primary font-mono"
            title={inviteUrl}
          >
            {inviteUrl}
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => copy(inviteUrl)}
          aria-label={copied ? "Link copied" : "Copy invitation link"}
        >
          {copied ? (
            <Check className="h-4 w-4 text-accent-primary" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className="flex items-center gap-4 text-xs text-text-secondary">
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          Created {createdDate.toLocaleDateString()}
        </span>
        {expiresDate && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Expires {expiresDate.toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
}
