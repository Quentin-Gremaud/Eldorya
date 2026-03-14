import type { TokenType } from "@/types/api";

export const TOKEN_COLORS: Record<TokenType, { hex: string; tailwind: string }> = {
  player: { hex: "#34D399", tailwind: "bg-emerald-400" },
  npc: { hex: "#F59E0B", tailwind: "bg-amber-400" },
  monster: { hex: "#EF4444", tailwind: "bg-red-400" },
  location: { hex: "#8B5CF6", tailwind: "bg-violet-400" },
};

export const TOKEN_FALLBACK_COLOR = "#9CA3AF";
