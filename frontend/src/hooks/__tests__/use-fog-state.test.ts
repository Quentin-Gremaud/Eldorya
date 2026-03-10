import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useFogState } from "../use-fog-state";

const mockApiFetch = jest.fn();
const mockSocketOn = jest.fn();
const mockSocketOff = jest.fn();

jest.mock("@/lib/api/use-api-client", () => ({
  useApiClient: () => mockApiFetch,
}));

jest.mock("@/providers/web-socket-provider", () => ({
  useWebSocketContext: () => ({
    socket: {
      on: mockSocketOn,
      off: mockSocketOff,
    },
    status: "connected",
  }),
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

describe("useFogState", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return empty fogZones when API returns 404", async () => {
    mockApiFetch.mockRejectedValue({ statusCode: 404, message: "Not Found" });

    const { result } = renderHook(
      () => useFogState("campaign-1", "player-1", "level-1"),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.fogZones).toEqual([]);
    expect(result.current.isError).toBe(false);
  });

  it("should return fogZones when API returns data", async () => {
    const mockFogZones = [
      {
        id: "fz-1",
        mapLevelId: "level-1",
        playerId: "player-1",
        x: 100,
        y: 200,
        width: 300,
        height: 400,
        revealed: true,
        createdAt: "2026-03-10",
      },
    ];

    mockApiFetch.mockResolvedValue({ data: mockFogZones });

    const { result } = renderHook(
      () => useFogState("campaign-1", "player-1", "level-1"),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.fogZones).toHaveLength(1);
    });

    expect(result.current.fogZones[0].id).toBe("fz-1");
    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/campaigns/campaign-1/maps/level-1/fog?playerId=player-1"
    );
  });

  it("should handle non-404 error states gracefully", async () => {
    mockApiFetch.mockRejectedValue({ statusCode: 500, message: "Server Error" });

    const { result } = renderHook(
      () => useFogState("campaign-1", "player-1", "level-1"),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.fogZones).toEqual([]);
  });

  it("should not fetch when playerId is null", () => {
    const { result } = renderHook(
      () => useFogState("campaign-1", null, "level-1"),
      { wrapper: createWrapper() }
    );

    expect(result.current.fogZones).toEqual([]);
    expect(mockApiFetch).not.toHaveBeenCalled();
  });

  it("should not fetch when mapLevelId is null", () => {
    const { result } = renderHook(
      () => useFogState("campaign-1", "player-1", null),
      { wrapper: createWrapper() }
    );

    expect(result.current.fogZones).toEqual([]);
    expect(mockApiFetch).not.toHaveBeenCalled();
  });

  describe("WebSocket integration", () => {
    it("should subscribe to FogZoneRevealed and FogZoneHidden events", async () => {
      mockApiFetch.mockResolvedValue({ data: [] });

      renderHook(
        () => useFogState("campaign-1", "player-1", "level-1"),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(mockSocketOn).toHaveBeenCalledWith(
          "FogZoneRevealed",
          expect.any(Function)
        );
        expect(mockSocketOn).toHaveBeenCalledWith(
          "FogZoneHidden",
          expect.any(Function)
        );
      });
    });

    it("should unsubscribe on cleanup", async () => {
      mockApiFetch.mockResolvedValue({ data: [] });

      const { unmount } = renderHook(
        () => useFogState("campaign-1", "player-1", "level-1"),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(mockSocketOn).toHaveBeenCalled();
      });

      unmount();

      expect(mockSocketOff).toHaveBeenCalledWith(
        "FogZoneRevealed",
        expect.any(Function)
      );
      expect(mockSocketOff).toHaveBeenCalledWith(
        "FogZoneHidden",
        expect.any(Function)
      );
    });

    it("should update cache when FogZoneRevealed is received", async () => {
      mockApiFetch.mockResolvedValue({ data: [] });

      const { result } = renderHook(
        () => useFogState("campaign-1", "player-1", "level-1"),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Find the FogZoneRevealed handler
      const revealedCall = mockSocketOn.mock.calls.find(
        (call: [string, Function]) => call[0] === "FogZoneRevealed"
      );
      const revealedHandler = revealedCall![1];

      act(() => {
        revealedHandler({
          type: "FogZoneRevealed",
          data: {
            campaignId: "campaign-1",
            playerId: "player-1",
            fogZoneId: "zone-1",
            mapLevelId: "level-1",
            x: 50,
            y: 60,
            width: 100,
            height: 200,
            revealedAt: "2026-03-10T10:00:00.000Z",
          },
          metadata: {
            campaignId: "campaign-1",
            sessionId: "session-1",
            timestamp: "2026-03-10T10:00:00.000Z",
          },
        });
      });

      await waitFor(() => {
        expect(result.current.fogZones).toHaveLength(1);
      });

      expect(result.current.fogZones[0]).toEqual(
        expect.objectContaining({
          id: "zone-1",
          x: 50,
          y: 60,
          width: 100,
          height: 200,
        })
      );
    });

    it("should update cache when FogZoneHidden is received", async () => {
      const initialZones = [
        {
          id: "zone-1",
          mapLevelId: "level-1",
          playerId: "player-1",
          x: 50,
          y: 60,
          width: 100,
          height: 200,
          revealed: true,
          createdAt: "2026-03-10",
        },
      ];

      mockApiFetch.mockResolvedValue({ data: initialZones });

      const { result } = renderHook(
        () => useFogState("campaign-1", "player-1", "level-1"),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.fogZones).toHaveLength(1);
      });

      const hiddenCall = mockSocketOn.mock.calls.find(
        (call: [string, Function]) => call[0] === "FogZoneHidden"
      );
      const hiddenHandler = hiddenCall![1];

      act(() => {
        hiddenHandler({
          type: "FogZoneHidden",
          data: {
            campaignId: "campaign-1",
            playerId: "player-1",
            fogZoneId: "zone-1",
            mapLevelId: "level-1",
          },
          metadata: {
            campaignId: "campaign-1",
            sessionId: "session-1",
            timestamp: "2026-03-10T11:00:00.000Z",
          },
        });
      });

      await waitFor(() => {
        expect(result.current.fogZones).toHaveLength(0);
      });
    });

    it("should ignore events from different campaigns", async () => {
      mockApiFetch.mockResolvedValue({ data: [] });

      const { result } = renderHook(
        () => useFogState("campaign-1", "player-1", "level-1"),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const revealedCall = mockSocketOn.mock.calls.find(
        (call: [string, Function]) => call[0] === "FogZoneRevealed"
      );
      const revealedHandler = revealedCall![1];

      act(() => {
        revealedHandler({
          type: "FogZoneRevealed",
          data: {
            campaignId: "other-campaign",
            playerId: "player-1",
            fogZoneId: "zone-1",
            mapLevelId: "level-1",
            x: 50,
            y: 60,
            width: 100,
            height: 200,
            revealedAt: "2026-03-10T10:00:00.000Z",
          },
          metadata: {},
        });
      });

      // Should remain empty — event from different campaign
      expect(result.current.fogZones).toHaveLength(0);
    });

    it("should not subscribe when playerId is null", () => {
      renderHook(
        () => useFogState("campaign-1", null, "level-1"),
        { wrapper: createWrapper() }
      );

      expect(mockSocketOn).not.toHaveBeenCalled();
    });

    it("should not subscribe when mapLevelId is null", () => {
      renderHook(
        () => useFogState("campaign-1", "player-1", null),
        { wrapper: createWrapper() }
      );

      expect(mockSocketOn).not.toHaveBeenCalled();
    });
  });
});
