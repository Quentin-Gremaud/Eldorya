"use client";

import type { InventoryItem } from "@/types/api";
import { Sword, Shield, Gem } from "lucide-react";

interface ItemCardProps {
  item: InventoryItem;
  compact?: boolean;
}

function getItemIcon(slotType: string) {
  switch (slotType) {
    case "weapon_shield":
      return Sword;
    case "ring1":
    case "ring2":
      return Gem;
    default:
      return Shield;
  }
}

export function ItemCard({ item, compact = false }: ItemCardProps) {
  const Icon = getItemIcon(item.slotType);
  const modifiers = Object.entries(item.statModifiers);

  if (compact) {
    return (
      <div className="flex items-center gap-2 rounded-md bg-surface-interactive px-2 py-1">
        <Icon className="h-4 w-4 shrink-0 text-accent-primary" />
        <span className="truncate text-xs text-text-primary">{item.name}</span>
        <span className="shrink-0 text-xs text-text-muted">
          {item.weight}kg
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-surface-elevated p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 shrink-0 text-accent-primary" />
        <span className="truncate text-sm font-medium text-text-primary">
          {item.name}
        </span>
      </div>
      {item.description && (
        <p className="text-xs text-text-secondary line-clamp-2">
          {item.description}
        </p>
      )}
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>{item.weight}kg</span>
        {modifiers.length > 0 && (
          <div className="flex gap-1">
            {modifiers.map(([stat, value]) => (
              <span
                key={stat}
                className={
                  value > 0 ? "text-accent-primary" : "text-danger"
                }
              >
                {value > 0 ? "+" : ""}
                {value} {stat.slice(0, 3)}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
