import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useCampaigns } from "../use-campaigns";
import { CampaignSummary } from "@/types/api";

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

describe("useCampaigns", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return loading state initially", () => {
    mockApiFetch.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useCampaigns(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.campaigns).toEqual([]);
    expect(result.current.isError).toBe(false);
  });

  it("should return campaigns on success", async () => {
    const campaigns: CampaignSummary[] = [
      {
        id: "campaign-1",
        name: "Dragon Quest",
        description: "An epic adventure",
        coverImageUrl: null,
        status: "active",
        role: "gm",
        playerCount: 4,
        lastSessionDate: null,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ];

    mockApiFetch.mockResolvedValue({ data: campaigns });

    const { result } = renderHook(() => useCampaigns(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.campaigns).toHaveLength(1);
    expect(result.current.campaigns[0].name).toBe("Dragon Quest");
    expect(result.current.campaigns[0].role).toBe("gm");
    expect(result.current.isError).toBe(false);
  });

  it("should handle error state", async () => {
    mockApiFetch.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useCampaigns(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.campaigns).toEqual([]);
  });

  it("should return empty array when no campaigns", async () => {
    mockApiFetch.mockResolvedValue({ data: [] });

    const { result } = renderHook(() => useCampaigns(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.campaigns).toEqual([]);
    expect(result.current.isError).toBe(false);
  });
});
