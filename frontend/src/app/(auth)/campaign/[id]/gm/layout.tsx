import type { ReactNode } from "react";

export default function GmCockpitLayout({ children }: { children: ReactNode }) {
  return <div className="flex min-h-screen bg-surface-base">{children}</div>;
}
