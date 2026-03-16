import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useSessionWebSocket } from "../use-session-web-socket";
import type { Session } from "@/types/api";

// Mock socket
const listeners: Record<string, ((...args: unknown[]) => void)[]> = {};
const mockSocket = {
  on: jest.fn((event: string, handler: (...args: unknown[]) => void) => {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(handler);
  }),
  off: jest.fn((event: string, handler: (...args: unknown[]) => void) => {
    if (listeners[event]) {
      listeners[event] = listeners[event].filter((h) => h !== handler);
    }
  }),
};

jest.mock("@/providers/web-socket-provider", () => ({
  useWebSocketContext: () => ({ socket: mockSocket }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return { queryClient, Wrapper: ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children) };
}

function emit(event: string, payload: unknown) {
  (listeners[event] ?? []).forEach((h) => h(payload));
}

describe("useSessionWebSocket", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(listeners).forEach((k) => delete listeners[k]);
  });

  it("should update query cache to live on SessionModeLive event", () => {
    const { queryClient, Wrapper } = createWrapper();
    const session: Session = {
      id: "s1",
      campaignId: "c1",
      gmUserId: "gm1",
      mode: "preparation",
      status: "active",
      startedAt: "2026-03-14T10:00:00.000Z",
      endedAt: null,
    };
    queryClient.setQueryData(["session", "c1", "active"], session);

    renderHook(() => useSessionWebSocket("c1"), { wrapper: Wrapper });

    act(() => {
      emit("SessionModeLive", {
        type: "SessionModeLive",
        data: { sessionId: "s1", campaignId: "c1", mode: "live" },
      });
    });

    const updated = queryClient.getQueryData<Session>(["session", "c1", "active"]);
    expect(updated?.mode).toBe("live");
  });

  it("should update query cache to preparation on SessionModePreparation event", () => {
    const { queryClient, Wrapper } = createWrapper();
    const session: Session = {
      id: "s1",
      campaignId: "c1",
      gmUserId: "gm1",
      mode: "live",
      status: "active",
      startedAt: "2026-03-14T10:00:00.000Z",
      endedAt: null,
    };
    queryClient.setQueryData(["session", "c1", "active"], session);

    renderHook(() => useSessionWebSocket("c1"), { wrapper: Wrapper });

    act(() => {
      emit("SessionModePreparation", {
        type: "SessionModePreparation",
        data: { sessionId: "s1", campaignId: "c1", mode: "preparation" },
      });
    });

    const updated = queryClient.getQueryData<Session>(["session", "c1", "active"]);
    expect(updated?.mode).toBe("preparation");
  });

  it("should ignore events for different campaigns", () => {
    const { queryClient, Wrapper } = createWrapper();
    const session: Session = {
      id: "s1",
      campaignId: "c1",
      gmUserId: "gm1",
      mode: "preparation",
      status: "active",
      startedAt: "2026-03-14T10:00:00.000Z",
      endedAt: null,
    };
    queryClient.setQueryData(["session", "c1", "active"], session);

    renderHook(() => useSessionWebSocket("c1"), { wrapper: Wrapper });

    act(() => {
      emit("SessionModeLive", {
        type: "SessionModeLive",
        data: { sessionId: "s2", campaignId: "c2", mode: "live" },
      });
    });

    const updated = queryClient.getQueryData<Session>(["session", "c1", "active"]);
    expect(updated?.mode).toBe("preparation");
  });

  it("should cleanup listeners on unmount", () => {
    const { Wrapper } = createWrapper();
    const { unmount } = renderHook(() => useSessionWebSocket("c1"), { wrapper: Wrapper });

    expect(mockSocket.on).toHaveBeenCalledTimes(2);
    unmount();
    expect(mockSocket.off).toHaveBeenCalledTimes(2);
  });
});
