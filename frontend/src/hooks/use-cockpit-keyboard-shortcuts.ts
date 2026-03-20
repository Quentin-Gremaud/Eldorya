"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const VIEW_KEYS: Record<string, string> = {
  "1": "session",
  "2": "players",
  "3": "npcs",
  "4": "chat",
  "5": "prep",
};

export function useCockpitKeyboardShortcuts(campaignId: string) {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.target as HTMLElement)?.isContentEditable) return;

      const view = VIEW_KEYS[e.key];
      if (view) {
        e.preventDefault();
        router.push(`/campaign/${campaignId}/gm/${view}`);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [campaignId, router]);
}
