"use client";

import { createContext, useContext, type ReactNode } from "react";

interface CampaignContextValue {
  // Will be implemented in Epic 2
  campaignId: string | null;
  role: "gm" | "player" | null;
}

const CampaignContext = createContext<CampaignContextValue>({
  campaignId: null,
  role: null,
});

export function useCampaignContext() {
  return useContext(CampaignContext);
}

export function CampaignProvider({ children }: { children: ReactNode }) {
  return (
    <CampaignContext.Provider value={{ campaignId: null, role: null }}>
      {children}
    </CampaignContext.Provider>
  );
}
