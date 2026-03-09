import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useCreateInvitation } from "../use-create-invitation";

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

describe("useCreateInvitation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call API with correct parameters", async () => {
    mockApiFetch.mockResolvedValue({
      data: {
        token: "raw-token-abc",
        inviteUrl: "http://localhost:3000/invite/raw-token-abc",
        expiresAt: "2026-03-08T12:00:00Z",
      },
    });

    const { result } = renderHook(
      () => useCreateInvitation("campaign-456"),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      result.current.mutate(7);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/campaigns/campaign-456/invitations",
      {
        method: "POST",
        body: JSON.stringify({ expiresInDays: 7 }),
      }
    );
  });

  it("should return invitation data on success", async () => {
    mockApiFetch.mockResolvedValue({
      data: {
        token: "raw-token-abc",
        inviteUrl: "http://localhost:3000/invite/raw-token-abc",
        expiresAt: "2026-03-08T12:00:00Z",
      },
    });

    const { result } = renderHook(
      () => useCreateInvitation("campaign-456"),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      result.current.mutate(7);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.token).toBe("raw-token-abc");
    expect(result.current.data?.inviteUrl).toBe(
      "http://localhost:3000/invite/raw-token-abc"
    );
  });

  it("should report isError true when API call fails", async () => {
    mockApiFetch.mockRejectedValue(new Error("Server error"));

    const { result } = renderHook(
      () => useCreateInvitation("campaign-456"),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      result.current.mutate(7);
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.data).toBeUndefined();
  });

  it("should set optimistic invitation data in cache on mutate", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    mockApiFetch.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(
      () => useCreateInvitation("campaign-456"),
      { wrapper: createWrapper(queryClient) }
    );

    await act(async () => {
      result.current.mutate(7);
    });

    const cached = queryClient.getQueryData<Record<string, unknown>>([
      "campaigns",
      "campaign-456",
      "invitation",
    ]);

    expect(cached).not.toBeNull();
    expect(cached?.campaignId).toBe("campaign-456");
    expect(cached?.status).toBe("active");
  });

  it("should rollback cache on API error", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    queryClient.setQueryData(
      ["campaigns", "campaign-456", "invitation"],
      null
    );

    mockApiFetch.mockRejectedValue(new Error("Server error"));

    const { result } = renderHook(
      () => useCreateInvitation("campaign-456"),
      { wrapper: createWrapper(queryClient) }
    );

    await act(async () => {
      result.current.mutate(7);
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    const cached = queryClient.getQueryData([
      "campaigns",
      "campaign-456",
      "invitation",
    ]);
    expect(cached).toBeNull();
  });
});
