import type { ReactNode } from "react";
import { CampaignProvider } from "@/providers/campaign-provider";

export default function CampaignLayout({ children }: { children: ReactNode }) {
  return <CampaignProvider>{children}</CampaignProvider>;
}
