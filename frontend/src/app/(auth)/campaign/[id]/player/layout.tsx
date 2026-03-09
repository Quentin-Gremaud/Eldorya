import type { ReactNode } from "react";

export default function PlayerLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-surface-base">{children}</div>;
}
