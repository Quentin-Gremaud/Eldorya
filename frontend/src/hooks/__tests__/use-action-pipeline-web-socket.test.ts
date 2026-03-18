import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useActionPipelineWebSocket } from "../use-action-pipeline-web-socket";
import type { PendingAction, PingStatus } from "@/types/api";

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
  return {
    queryClient,
    Wrapper: ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children),
  };
}

function emit(event: string, payload: unknown) {
  (listeners[event] ?? []).forEach((h) => h(payload));
}

describe("useActionPipelineWebSocket", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(listeners).forEach((k) => delete listeners[k]);
  });

  it("should update ping status on PlayerPinged event", () => {
    const { queryClient, Wrapper } = createWrapper();

    renderHook(() => useActionPipelineWebSocket("c1", "s1"), {
      wrapper: Wrapper,
    });

    act(() => {
      emit("PlayerPinged", {
        type: "PlayerPinged",
        data: { sessionId: "s1", campaignId: "c1", playerId: "p1" },
        metadata: { timestamp: "2026-03-18T10:00:00.000Z" },
      });
    });

    const status = queryClient.getQueryData<PingStatus | null>([
      "actions", "c1", "s1", "ping-status",
    ]);
    expect(status?.playerId).toBe("p1");
  });

  it("should add action to pending queue on ActionProposed event", () => {
    const { queryClient, Wrapper } = createWrapper();
    queryClient.setQueryData(["actions", "c1", "s1", "pending"], []);

    renderHook(() => useActionPipelineWebSocket("c1", "s1"), {
      wrapper: Wrapper,
    });

    act(() => {
      emit("ActionProposed", {
        type: "ActionProposed",
        data: {
          actionId: "a1",
          sessionId: "s1",
          campaignId: "c1",
          playerId: "p1",
          actionType: "move",
          description: "I move north",
          target: null,
          proposedAt: "2026-03-18T10:05:00.000Z",
        },
      });
    });

    const actions = queryClient.getQueryData<PendingAction[]>([
      "actions", "c1", "s1", "pending",
    ]);
    expect(actions).toHaveLength(1);
    expect(actions?.[0].id).toBe("a1");
  });

  it("should not duplicate actions on ActionProposed", () => {
    const { queryClient, Wrapper } = createWrapper();
    const existing: PendingAction = {
      id: "a1",
      sessionId: "s1",
      campaignId: "c1",
      playerId: "p1",
      actionType: "move",
      description: "I move",
      target: null,
      status: "pending",
      proposedAt: "2026-03-18T10:05:00.000Z",
    };
    queryClient.setQueryData(["actions", "c1", "s1", "pending"], [existing]);

    renderHook(() => useActionPipelineWebSocket("c1", "s1"), {
      wrapper: Wrapper,
    });

    act(() => {
      emit("ActionProposed", {
        type: "ActionProposed",
        data: {
          actionId: "a1",
          sessionId: "s1",
          campaignId: "c1",
          playerId: "p1",
          actionType: "move",
          description: "I move",
          target: null,
          proposedAt: "2026-03-18T10:05:00.000Z",
        },
      });
    });

    const actions = queryClient.getQueryData<PendingAction[]>([
      "actions", "c1", "s1", "pending",
    ]);
    expect(actions).toHaveLength(1);
  });

  it("should ignore events for different campaigns", () => {
    const { queryClient, Wrapper } = createWrapper();

    renderHook(() => useActionPipelineWebSocket("c1", "s1"), {
      wrapper: Wrapper,
    });

    act(() => {
      emit("PlayerPinged", {
        type: "PlayerPinged",
        data: { sessionId: "s2", campaignId: "c2", playerId: "p1" },
        metadata: { timestamp: "2026-03-18T10:00:00.000Z" },
      });
    });

    const status = queryClient.getQueryData<PingStatus | null>([
      "actions", "c1", "s1", "ping-status",
    ]);
    expect(status).toBeUndefined();
  });

  it("should call onActionConfirmed when ActionProposedConfirmation event is received", () => {
    const { Wrapper } = createWrapper();
    const onActionConfirmed = jest.fn();

    renderHook(
      () =>
        useActionPipelineWebSocket("c1", "s1", { onActionConfirmed }),
      { wrapper: Wrapper }
    );

    act(() => {
      emit("ActionProposedConfirmation", {
        type: "ActionProposedConfirmation",
        data: { actionId: "a1", sessionId: "s1", campaignId: "c1" },
      });
    });

    expect(onActionConfirmed).toHaveBeenCalledWith("a1");
  });

  it("should not call onActionConfirmed for different campaigns", () => {
    const { Wrapper } = createWrapper();
    const onActionConfirmed = jest.fn();

    renderHook(
      () =>
        useActionPipelineWebSocket("c1", "s1", { onActionConfirmed }),
      { wrapper: Wrapper }
    );

    act(() => {
      emit("ActionProposedConfirmation", {
        type: "ActionProposedConfirmation",
        data: { actionId: "a1", sessionId: "s2", campaignId: "c2" },
      });
    });

    expect(onActionConfirmed).not.toHaveBeenCalled();
  });

  it("should cleanup listeners on unmount", () => {
    const { Wrapper } = createWrapper();
    const { unmount } = renderHook(
      () => useActionPipelineWebSocket("c1", "s1"),
      { wrapper: Wrapper }
    );

    expect(mockSocket.on).toHaveBeenCalledTimes(4);
    unmount();
    expect(mockSocket.off).toHaveBeenCalledTimes(4);
  });
});
