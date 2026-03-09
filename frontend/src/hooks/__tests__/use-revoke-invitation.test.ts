import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useRevokeInvitation } from "../use-revoke-invitation";

const mockApiFetch = jest.fn();

jest.mock("@/lib/api/use-api-client", () => ({
  useApiClient: () => mockApiFetch,
}));

function createWrapper(queryClient?: QueryClient) {
  const qc =
    queryClient ??
    new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: qc }, children);
  };
}

describe("useRevokeInvitation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call API with correct parameters", async () => {
    mockApiFetch.mockResolvedValue(undefined);

    const { result } = renderHook(
      () => useRevokeInvitation("campaign-456"),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      result.current.mutate("inv-123");
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/campaigns/campaign-456/invitations/inv-123",
      { method: "DELETE" }
    );
  });

  it("should handle optimistic update by setting invitation to null", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    queryClient.setQueryData(
      ["campaigns", "campaign-456", "invitation"],
      {
        id: "inv-123",
        campaignId: "campaign-456",
        createdAt: "2026-03-01T12:00:00Z",
        expiresAt: "2026-03-08T12:00:00Z",
        status: "active",
      }
    );

    mockApiFetch.mockResolvedValue(undefined);

    const { result } = renderHook(
      () => useRevokeInvitation("campaign-456"),
      { wrapper: createWrapper(queryClient) }
    );

    await act(async () => {
      result.current.mutate("inv-123");
    });

    const cached = queryClient.getQueryData([
      "campaigns",
      "campaign-456",
      "invitation",
    ]);
    expect(cached).toBeNull();
  });

  it("should report isError true when API call fails", async () => {
    mockApiFetch.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(
      () => useRevokeInvitation("campaign-456"),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      result.current.mutate("inv-123");
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it("should rollback cache to previous value on API error", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const previousInvitation = {
      id: "inv-123",
      campaignId: "campaign-456",
      createdAt: "2026-03-01T12:00:00Z",
      expiresAt: "2026-03-08T12:00:00Z",
      status: "active",
    };

    queryClient.setQueryData(
      ["campaigns", "campaign-456", "invitation"],
      previousInvitation
    );

    mockApiFetch.mockRejectedValue(new Error("Server error"));

    const { result } = renderHook(
      () => useRevokeInvitation("campaign-456"),
      { wrapper: createWrapper(queryClient) }
    );

    await act(async () => {
      result.current.mutate("inv-123");
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    const cached = queryClient.getQueryData([
      "campaigns",
      "campaign-456",
      "invitation",
    ]);
    expect(cached).toEqual(previousInvitation);
  });

  it("should report isPending true during mutation", async () => {
    mockApiFetch.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(
      () => useRevokeInvitation("campaign-456"),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.mutate("inv-123");
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });
  });
});
