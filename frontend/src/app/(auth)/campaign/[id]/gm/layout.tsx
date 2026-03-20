"use client";

import { use } from "react";
import type { ReactNode } from "react";
import { GmSidebar } from "@/components/layout/gm-sidebar";
import { DesktopOnlyGuard } from "@/components/shared/desktop-only-guard";
import { useActiveSession } from "@/hooks/use-active-session";
import { usePendingActions } from "@/hooks/use-pending-actions";
import { useCampaignPlayers } from "@/hooks/use-campaign-players";
import { usePresence } from "@/hooks/use-presence";
import { useCockpitKeyboardShortcuts } from "@/hooks/use-cockpit-keyboard-shortcuts";
import type { SidebarPlayer } from "@/components/layout/gm-sidebar";

export default function GmCockpitLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id: campaignId } = use(params);
  const { session } = useActiveSession(campaignId);
  const { actions: pendingActions } = usePendingActions(
    campaignId,
    session?.id ?? ""
  );
  const { players } = useCampaignPlayers(campaignId);
  const { getPresence } = usePresence(session?.id ?? "");
  useCockpitKeyboardShortcuts(campaignId);

  const pendingPlayerIds = new Set(
    (pendingActions ?? []).map((a) => a.playerId)
  );

  const sidebarPlayers: SidebarPlayer[] = players.map((p) => ({
    userId: p.userId,
    displayName: p.displayName,
    status: pendingPlayerIds.has(p.userId) ? "action-pending" : getPresence(p.userId),
  }));

  return (
    <DesktopOnlyGuard campaignId={campaignId}>
      <div className="flex min-h-screen bg-surface-base">
        <GmSidebar
          campaignId={campaignId}
          pendingActionsCount={pendingActions?.length ?? 0}
          players={sidebarPlayers}
        />
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </DesktopOnlyGuard>
  );
}
