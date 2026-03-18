import { renderHook, act } from "@testing-library/react";
import { usePingNotification } from "../use-ping-notification";

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

function emit(event: string, payload: unknown) {
  (listeners[event] ?? []).forEach((h) => h(payload));
}

describe("usePingNotification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    Object.keys(listeners).forEach((k) => delete listeners[k]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should set isPinged to true on PlayerPinged event", () => {
    const { result } = renderHook(() => usePingNotification("c1"));

    expect(result.current.isPinged).toBe(false);

    act(() => {
      emit("PlayerPinged", {
        type: "PlayerPinged",
        data: { sessionId: "s1", campaignId: "c1", playerId: "p1" },
      });
    });

    expect(result.current.isPinged).toBe(true);
  });

  it("should ignore events for different campaigns", () => {
    const { result } = renderHook(() => usePingNotification("c1"));

    act(() => {
      emit("PlayerPinged", {
        type: "PlayerPinged",
        data: { sessionId: "s2", campaignId: "c2", playerId: "p1" },
      });
    });

    expect(result.current.isPinged).toBe(false);
  });

  it("should clear ping on clearPing call", () => {
    const { result } = renderHook(() => usePingNotification("c1"));

    act(() => {
      emit("PlayerPinged", {
        type: "PlayerPinged",
        data: { sessionId: "s1", campaignId: "c1", playerId: "p1" },
      });
    });

    expect(result.current.isPinged).toBe(true);

    act(() => {
      result.current.clearPing();
    });

    expect(result.current.isPinged).toBe(false);
  });

  it("should auto-dismiss after 30 seconds", () => {
    const { result } = renderHook(() => usePingNotification("c1"));

    act(() => {
      emit("PlayerPinged", {
        type: "PlayerPinged",
        data: { sessionId: "s1", campaignId: "c1", playerId: "p1" },
      });
    });

    expect(result.current.isPinged).toBe(true);

    act(() => {
      jest.advanceTimersByTime(30_000);
    });

    expect(result.current.isPinged).toBe(false);
  });

  it("should clear auto-dismiss timeout on manual clearPing", () => {
    const { result } = renderHook(() => usePingNotification("c1"));

    act(() => {
      emit("PlayerPinged", {
        type: "PlayerPinged",
        data: { sessionId: "s1", campaignId: "c1", playerId: "p1" },
      });
    });

    expect(result.current.isPinged).toBe(true);

    act(() => {
      result.current.clearPing();
    });

    expect(result.current.isPinged).toBe(false);

    // Advancing time should not re-trigger anything
    act(() => {
      jest.advanceTimersByTime(30_000);
    });

    expect(result.current.isPinged).toBe(false);
  });

  it("should cleanup listener on unmount", () => {
    const { unmount } = renderHook(() => usePingNotification("c1"));

    expect(mockSocket.on).toHaveBeenCalledTimes(1);
    unmount();
    expect(mockSocket.off).toHaveBeenCalledTimes(1);
  });
});
