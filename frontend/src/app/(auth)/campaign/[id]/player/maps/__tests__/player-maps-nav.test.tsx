import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

jest.mock("@clerk/nextjs", () => ({
  useUser: () => ({
    user: { id: "user-1", firstName: "Player" },
  }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/hooks/use-campaign", () => ({
  useCampaign: () => ({
    campaign: { name: "Dragon Quest" },
    isLoading: false,
    isError: false,
  }),
}));

jest.mock("@/hooks/use-map-levels", () => ({
  useMapLevels: () => ({
    mapLevels: [],
    isLoading: false,
    isError: false,
  }),
}));

jest.mock("@/hooks/use-tokens", () => ({
  useTokens: () => ({
    tokens: [],
    isLoading: false,
    isError: false,
  }),
}));

jest.mock("@/hooks/use-fog-state", () => ({
  useFogState: () => ({ fogZones: [] }),
}));

jest.mock("@/hooks/use-campaign-players", () => ({
  useCampaignPlayers: () => ({
    players: [],
    isLoading: false,
    isError: false,
  }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

import { PlayerMapsContent } from "../page";

describe("PlayerMapsContent navigation", () => {
  it("renders breadcrumb with Dashboard, Campaign Name, and Maps", () => {
    render(<PlayerMapsContent campaignId="c-1" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByLabelText("breadcrumb")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("link", { name: "Dragon Quest" })).toHaveAttribute("href", "/campaign/c-1/player");
  });

  it("renders back button linking to player hub", () => {
    render(<PlayerMapsContent campaignId="c-1" />, {
      wrapper: createWrapper(),
    });

    const backButton = screen.getByLabelText("Go back");
    expect(backButton).toHaveAttribute("href", "/campaign/c-1/player");
  });
});
