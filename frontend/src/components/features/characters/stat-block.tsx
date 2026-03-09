import type { CharacterStats } from "@/types/api";

export const STAT_LABELS: Record<string, string> = {
  strength: "STR",
  dexterity: "DEX",
  constitution: "CON",
  intelligence: "INT",
  wisdom: "WIS",
  charisma: "CHA",
};

export function StatBlock({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="flex flex-col items-center rounded-md border border-border bg-surface-base p-3">
      <span className="text-xs font-medium text-muted-foreground uppercase">
        {label}
      </span>
      <span className="mt-1 text-2xl font-bold text-foreground">{value}</span>
    </div>
  );
}

export function StatBlockGrid({ stats }: { stats: CharacterStats }) {
  return (
    <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
      {Object.entries(STAT_LABELS).map(([key, label]) => (
        <StatBlock
          key={key}
          label={label}
          value={stats[key as keyof CharacterStats]}
        />
      ))}
    </div>
  );
}
