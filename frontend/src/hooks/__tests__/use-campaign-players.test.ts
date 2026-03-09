import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useCampaignPlayers } from "../use-campaign-players";
import type { CampaignPlayersResponse } from "@/types/api";

const mockApiFetch = jest.fn();

jest.mock("@/lib/api/use-api-client", () => ({
  useApiClient: () => mockApiFetch,
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };
}

describe("useCampaignPlayers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return loading state initially", () => {
    mockApiFetch.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useCampaignPlayers("campaign-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.players).toEqual([]);
    expect(result.current.hasActiveInvitation).toBe(false);
    expect(result.current.allReady).toBe(false);
    expect(result.current.playerCount).toBe(0);
    expect(result.current.isError).toBe(false);
  });

  it("should return players on success", async () => {
    const response: CampaignPlayersResponse = {
      players: [
        {
          userId: "user-1",
          displayName: "Alice Smith",
          status: "joined",
          joinedAt: "2026-03-01T10:00:00.000Z",
        },
        {
          userId: "user-2",
          displayName: "Bob Jones",
          status: "joined",
          joinedAt: "2026-03-02T10:00:00.000Z",
        },
      ],
      hasActiveInvitation: true,
      allReady: false,
      playerCount: 2,
    };

    mockApiFetch.mockResolvedValue({ data: response });

    const { result } = renderHook(() => useCampaignPlayers("campaign-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.players).toHaveLength(2);
    expect(result.current.players[0].displayName).toBe("Alice Smith");
    expect(result.current.players[1].displayName).toBe("Bob Jones");
    expect(result.current.hasActiveInvitation).toBe(true);
    expect(result.current.allReady).toBe(false);
    expect(result.current.playerCount).toBe(2);
    expect(result.current.isError).toBe(false);
  });

  it("should handle empty response", async () => {
    const response: CampaignPlayersResponse = {
      players: [],
      hasActiveInvitation: false,
      allReady: false,
      playerCount: 0,
    };

    mockApiFetch.mockResolvedValue({ data: response });

    const { result } = renderHook(() => useCampaignPlayers("campaign-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.players).toEqual([]);
    expect(result.current.playerCount).toBe(0);
  });

  it("should handle error state", async () => {
    mockApiFetch.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useCampaignPlayers("campaign-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.players).toEqual([]);
  });

  it("should call API with correct endpoint", async () => {
    mockApiFetch.mockResolvedValue({
      data: { players: [], hasActiveInvitation: false, allReady: false, playerCount: 0 },
    });

    renderHook(() => useCampaignPlayers("campaign-xyz"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith(
        "/api/campaigns/campaign-xyz/players"
      );
    });
  });
});
