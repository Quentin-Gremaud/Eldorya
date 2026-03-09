import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useTokens } from "../use-tokens";

const mockApiFetch = jest.fn();

jest.mock("@/lib/api/use-api-client", () => ({
  useApiClient: () => mockApiFetch,
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
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

describe("useTokens", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch tokens for a given campaign and map level", async () => {
    const mockTokens = [
      {
        id: "token-1",
        campaignId: "campaign-1",
        mapLevelId: "level-1",
        x: 100,
        y: 200,
        tokenType: "player",
        label: "Warrior",
        createdAt: "2026-03-09T10:00:00.000Z",
        updatedAt: "2026-03-09T10:00:00.000Z",
      },
    ];

    mockApiFetch.mockResolvedValue({ data: mockTokens });

    const { result } = renderHook(
      () => useTokens("campaign-1", "level-1"),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.tokens).toHaveLength(1);
    });

    expect(result.current.tokens[0].id).toBe("token-1");
    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/campaigns/campaign-1/tokens?mapLevelId=level-1"
    );
  });

  it("should return empty array when mapLevelId is null", async () => {
    const { result } = renderHook(
      () => useTokens("campaign-1", null),
      { wrapper: createWrapper() }
    );

    expect(result.current.tokens).toEqual([]);
    expect(mockApiFetch).not.toHaveBeenCalled();
  });

  it("should handle API error", async () => {
    mockApiFetch.mockRejectedValue(new Error("API error"));

    const { result } = renderHook(
      () => useTokens("campaign-1", "level-1"),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
