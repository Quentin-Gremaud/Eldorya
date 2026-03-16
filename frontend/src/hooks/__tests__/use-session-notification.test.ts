import { renderHook, act } from "@testing-library/react";
import { useSessionNotification } from "../use-session-notification";

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

describe("useSessionNotification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(listeners).forEach((k) => delete listeners[k]);
  });

  it("should return isSessionLive=false initially", () => {
    const { result } = renderHook(() => useSessionNotification("c1"));
    expect(result.current.isSessionLive).toBe(false);
    expect(result.current.liveSessionId).toBeNull();
  });

  it("should set isSessionLive=true on SessionModeLive event", () => {
    const { result } = renderHook(() => useSessionNotification("c1"));

    act(() => {
      emit("SessionModeLive", {
        type: "SessionModeLive",
        data: { sessionId: "s1", campaignId: "c1", mode: "live" },
      });
    });

    expect(result.current.isSessionLive).toBe(true);
    expect(result.current.liveSessionId).toBe("s1");
  });

  it("should reset isSessionLive on SessionModePreparation event", () => {
    const { result } = renderHook(() => useSessionNotification("c1"));

    act(() => {
      emit("SessionModeLive", {
        type: "SessionModeLive",
        data: { sessionId: "s1", campaignId: "c1", mode: "live" },
      });
    });

    expect(result.current.isSessionLive).toBe(true);

    act(() => {
      emit("SessionModePreparation", {
        type: "SessionModePreparation",
        data: { sessionId: "s1", campaignId: "c1", mode: "preparation" },
      });
    });

    expect(result.current.isSessionLive).toBe(false);
  });

  it("should ignore events for different campaigns", () => {
    const { result } = renderHook(() => useSessionNotification("c1"));

    act(() => {
      emit("SessionModeLive", {
        type: "SessionModeLive",
        data: { sessionId: "s2", campaignId: "c2", mode: "live" },
      });
    });

    expect(result.current.isSessionLive).toBe(false);
  });
});
