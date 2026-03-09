import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useAccountDeletion } from "../use-account-deletion";

const mockSignOut = jest.fn();
const mockApiFetch = jest.fn();

jest.mock("@clerk/nextjs", () => ({
  useClerk: () => ({ signOut: mockSignOut }),
}));

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

describe("useAccountDeletion", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiFetch.mockImplementation((path: string) => {
      if (path.includes("active-campaigns")) {
        return Promise.resolve({ data: { count: 0, campaigns: [] } });
      }
      return Promise.resolve(undefined);
    });
  });

  it("should fetch active campaigns on mount", async () => {
    const { result } = renderHook(() => useAccountDeletion(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoadingCampaigns).toBe(false);
    });

    expect(mockApiFetch).toHaveBeenCalledWith("/api/account/active-campaigns");
  });

  it("should return active campaigns data when present", async () => {
    mockApiFetch.mockImplementation((path: string) => {
      if (path.includes("active-campaigns")) {
        return Promise.resolve({
          data: {
            count: 2,
            campaigns: [
              { id: "1", name: "Dragon Quest" },
              { id: "2", name: "Sword Coast" },
            ],
          },
        });
      }
      return Promise.resolve(undefined);
    });

    const { result } = renderHook(() => useAccountDeletion(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoadingCampaigns).toBe(false);
    });

    expect(result.current.activeCampaigns.count).toBe(2);
    expect(result.current.activeCampaigns.campaigns).toHaveLength(2);
    expect(result.current.activeCampaigns.campaigns[0].name).toBe("Dragon Quest");
  });

  it("should call DELETE /api/account when deleteAccount is called", async () => {
    const { result } = renderHook(() => useAccountDeletion(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoadingCampaigns).toBe(false);
    });

    act(() => {
      result.current.deleteAccount();
    });

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith("/api/account", { method: "DELETE" });
    });
  });

  it("should call signOut with redirect on successful deletion", async () => {
    const { result } = renderHook(() => useAccountDeletion(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoadingCampaigns).toBe(false);
    });

    act(() => {
      result.current.deleteAccount();
    });

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledWith({ redirectUrl: "/" });
    });
  });

  it("should expose deleteError when mutation fails", async () => {
    mockApiFetch.mockImplementation((path: string) => {
      if (path.includes("active-campaigns")) {
        return Promise.resolve({ data: { count: 0, campaigns: [] } });
      }
      return Promise.reject(new Error("Server error"));
    });

    const { result } = renderHook(() => useAccountDeletion(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoadingCampaigns).toBe(false);
    });

    act(() => {
      result.current.deleteAccount();
    });

    await waitFor(() => {
      expect(result.current.deleteError).toBeTruthy();
    });
  });

  it("should default to empty campaigns when query has not loaded", () => {
    mockApiFetch.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useAccountDeletion(), {
      wrapper: createWrapper(),
    });

    expect(result.current.activeCampaigns).toEqual({ count: 0, campaigns: [] });
    expect(result.current.isLoadingCampaigns).toBe(true);
  });
});
