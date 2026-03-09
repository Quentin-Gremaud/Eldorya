import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { usePlayerCampaigns } from "../use-player-campaigns";
import { PlayerCampaign } from "@/types/api";

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

describe("usePlayerCampaigns", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return loading state initially", () => {
    mockApiFetch.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => usePlayerCampaigns(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.campaigns).toEqual([]);
    expect(result.current.isError).toBe(false);
  });

  it("should return player campaigns on success", async () => {
    const campaigns: PlayerCampaign[] = [
      {
        id: "campaign-1",
        name: "Dragon Quest",
        description: "An epic adventure",
        coverImageUrl: null,
        status: "active",
        gmDisplayName: "John Doe",
        playerCount: 4,
        lastSessionDate: null,
        role: "player",
      },
    ];

    mockApiFetch.mockResolvedValue({ data: campaigns });

    const { result } = renderHook(() => usePlayerCampaigns(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.campaigns).toHaveLength(1);
    expect(result.current.campaigns[0].name).toBe("Dragon Quest");
    expect(result.current.campaigns[0].role).toBe("player");
    expect(result.current.campaigns[0].gmDisplayName).toBe("John Doe");
    expect(result.current.isError).toBe(false);
  });

  it("should handle error state", async () => {
    mockApiFetch.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => usePlayerCampaigns(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.campaigns).toEqual([]);
  });

  it("should return empty array when no player campaigns", async () => {
    mockApiFetch.mockResolvedValue({ data: [] });

    const { result } = renderHook(() => usePlayerCampaigns(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.campaigns).toEqual([]);
    expect(result.current.isError).toBe(false);
  });

  it("should fetch from /api/campaigns/player endpoint", async () => {
    mockApiFetch.mockResolvedValue({ data: [] });

    renderHook(() => usePlayerCampaigns(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalled();
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/campaigns/player")
    );
  });
});
