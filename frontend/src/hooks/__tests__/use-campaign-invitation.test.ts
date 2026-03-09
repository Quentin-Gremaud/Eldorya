import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useCampaignInvitation } from "../use-campaign-invitation";

const mockApiFetch = jest.fn();

jest.mock("@/lib/api/use-api-client", () => ({
  useApiClient: () => mockApiFetch,
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };
}

describe("useCampaignInvitation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return invitation data on success", async () => {
    mockApiFetch.mockResolvedValue({
      data: {
        id: "inv-123",
        campaignId: "campaign-456",
        createdAt: "2026-03-01T12:00:00Z",
        expiresAt: "2026-03-08T12:00:00Z",
        status: "active",
      },
    });

    const { result } = renderHook(
      () => useCampaignInvitation("campaign-456"),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.invitation).not.toBeNull();
    expect(result.current.invitation!.id).toBe("inv-123");
    expect(result.current.invitation!.status).toBe("active");
  });

  it("should handle null response when no invitation exists", async () => {
    mockApiFetch.mockResolvedValue({ data: null });

    const { result } = renderHook(
      () => useCampaignInvitation("campaign-456"),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.invitation).toBeNull();
  });

  it("should report isLoading true while fetching", () => {
    mockApiFetch.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(
      () => useCampaignInvitation("campaign-456"),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.invitation).toBeNull();
  });

  it("should report isError true when API call fails", async () => {
    mockApiFetch.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(
      () => useCampaignInvitation("campaign-456"),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.invitation).toBeNull();
  });

  it("should call API with correct URL", async () => {
    mockApiFetch.mockResolvedValue({ data: null });

    renderHook(() => useCampaignInvitation("campaign-789"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith(
        "/api/campaigns/campaign-789/invitation"
      );
    });
  });
});
