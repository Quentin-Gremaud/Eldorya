import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useRevealFogZoneToAll } from "../use-reveal-fog-zone-to-all";
import { toast } from "sonner";
import type { FogZone } from "@/types/api";

const mockApiFetch = jest.fn();

jest.mock("@/lib/api/use-api-client", () => ({
  useApiClient: () => mockApiFetch,
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const CAMPAIGN_ID = "campaign-1";
const PREVIEW_PLAYER_ID = "player-1";
const MAP_LEVEL_ID = "map-level-1";
const FOG_ZONE_ID = "fog-zone-1";

function createWrapper(queryClient?: QueryClient) {
  const client =
    queryClient ??
    new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client }, children);
  };
}

describe("useRevealFogZoneToAll", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const mutationInput = {
    fogZoneId: FOG_ZONE_ID,
    mapLevelId: MAP_LEVEL_ID,
    x: 10,
    y: 20,
    width: 100,
    height: 200,
    previewPlayerId: PREVIEW_PLAYER_ID,
  };

  it("should send POST to /api/campaigns/:campaignId/fog/reveal-all with payload", async () => {
    mockApiFetch.mockResolvedValue(undefined);

    const { result } = renderHook(() => useRevealFogZoneToAll(CAMPAIGN_ID), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate(mutationInput);
    });

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith(
        `/api/campaigns/${CAMPAIGN_ID}/fog/reveal-all`,
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining(FOG_ZONE_ID),
        })
      );
    });
  });

  it("should NOT include playerId in the payload", async () => {
    mockApiFetch.mockResolvedValue(undefined);

    const { result } = renderHook(() => useRevealFogZoneToAll(CAMPAIGN_ID), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate(mutationInput);
    });

    await waitFor(() => {
      const body = JSON.parse(
        mockApiFetch.mock.calls[0][1].body as string
      );
      expect(body.playerId).toBeUndefined();
      expect(body.commandId).toBeDefined();
      expect(body.fogZoneId).toBe(FOG_ZONE_ID);
      expect(body.mapLevelId).toBe(MAP_LEVEL_ID);
      expect(body.x).toBe(10);
      expect(body.y).toBe(20);
      expect(body.width).toBe(100);
      expect(body.height).toBe(200);
    });
  });

  it("should add zone to query cache as optimistic update", async () => {
    mockApiFetch.mockResolvedValue(undefined);
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const queryKey = ["fog-state", CAMPAIGN_ID, PREVIEW_PLAYER_ID, MAP_LEVEL_ID];
    queryClient.setQueryData<FogZone[]>(queryKey, []);

    const { result } = renderHook(() => useRevealFogZoneToAll(CAMPAIGN_ID), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate(mutationInput);
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<FogZone[]>(queryKey);
      expect(cached).toHaveLength(1);
      expect(cached![0].id).toBe(FOG_ZONE_ID);
      expect(cached![0].revealed).toBe(true);
    });
  });

  it("should rollback on error", async () => {
    mockApiFetch.mockRejectedValue(new Error("Network error"));
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const queryKey = ["fog-state", CAMPAIGN_ID, PREVIEW_PLAYER_ID, MAP_LEVEL_ID];
    queryClient.setQueryData<FogZone[]>(queryKey, []);

    const { result } = renderHook(() => useRevealFogZoneToAll(CAMPAIGN_ID), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate(mutationInput);
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to reveal fog zone to all players");
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<FogZone[]>(queryKey);
      expect(cached).toHaveLength(0);
    });
  });

  it("should trigger delayed invalidation at 1.5s on settled", async () => {
    mockApiFetch.mockResolvedValue(undefined);
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useRevealFogZoneToAll(CAMPAIGN_ID), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate(mutationInput);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    await act(async () => {
      jest.advanceTimersByTime(1500);
    });

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["fog-state", CAMPAIGN_ID, PREVIEW_PLAYER_ID, MAP_LEVEL_ID],
        exact: true,
      })
    );
  });
});
