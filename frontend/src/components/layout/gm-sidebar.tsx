"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Map, Users, Ghost, MessageCircle, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PresenceStatus } from "@/types/api";
import { PresenceIndicator } from "@/components/shared/presence-indicator";

export interface SidebarPlayer {
  userId: string;
  displayName: string;
  status: PresenceStatus;
}

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  badgeCount?: number;
}

interface GmSidebarProps {
  campaignId: string;
  pendingActionsCount?: number;
  players?: SidebarPlayer[];
}

export function GmSidebar({
  campaignId,
  pendingActionsCount = 0,
  players = [],
}: GmSidebarProps) {
  const pathname = usePathname();
  const basePath = `/campaign/${campaignId}/gm`;

  const navItems: NavItem[] = [
    {
      label: "Session Live",
      icon: Map,
      path: `${basePath}/session`,
      badgeCount: pendingActionsCount,
    },
    { label: "Players", icon: Users, path: `${basePath}/players` },
    { label: "NPCs", icon: Ghost, path: `${basePath}/npcs` },
    { label: "Chat", icon: MessageCircle, path: `${basePath}/chat` },
    { label: "Prep Mode", icon: ClipboardList, path: `${basePath}/prep` },
  ];

  return (
    <aside
      className="flex w-60 shrink-0 flex-col border-r border-border bg-surface"
      aria-label="GM cockpit navigation"
    >
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const isActive =
            pathname === item.path ||
            (item.path !== basePath && pathname.startsWith(item.path + "/"));
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-muted font-semibold text-emerald-500"
                  : "text-text-secondary hover:bg-muted/50"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0",
                  isActive ? "text-emerald-500" : "text-text-secondary"
                )}
              />
              <span className="flex-1">{item.label}</span>
              {item.badgeCount !== undefined && item.badgeCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-xs font-medium text-white">
                  {item.badgeCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Connected players footer */}
      {players.length > 0 && (
        <div className="border-t border-border p-3">
          <p className="mb-2 text-xs font-medium text-text-secondary">
            Connected Players
          </p>
          <div className="flex flex-wrap gap-2">
            {players.map((player) => (
              <PresenceIndicator
                key={player.userId}
                displayName={player.displayName}
                status={player.status}
                size="sm"
              />
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
