import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useMoveToken } from "../use-move-token";

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

describe("useMoveToken", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiFetch.mockResolvedValue(undefined);
  });

  it("should call API with correct params", async () => {
    const { result } = renderHook(() => useMoveToken("campaign-1"), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({
        tokenId: "token-uuid",
        mapLevelId: "level-1",
        x: 300,
        y: 400,
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/campaigns/campaign-1/tokens/token-uuid/position",
      expect.objectContaining({
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      })
    );

    const body = JSON.parse(mockApiFetch.mock.calls[0][1].body);
    expect(body).toEqual(
      expect.objectContaining({
        x: 300,
        y: 400,
        commandId: expect.any(String),
      })
    );
  });

  it("should handle API error", async () => {
    mockApiFetch.mockRejectedValue(new Error("API error"));

    const { result } = renderHook(() => useMoveToken("campaign-1"), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({
        tokenId: "token-uuid",
        mapLevelId: "level-1",
        x: 300,
        y: 400,
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
