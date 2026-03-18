import { renderHook, act } from "@testing-library/react";
import { useActionOutcomeNotification } from "../use-action-outcome-notification";

describe("useActionOutcomeNotification", () => {
  it("should start with no outcome", () => {
    const { result } = renderHook(() => useActionOutcomeNotification());
    expect(result.current.outcome).toBeNull();
  });

  it("should set validated outcome on onActionValidated", () => {
    const { result } = renderHook(() => useActionOutcomeNotification());

    act(() => {
      result.current.onActionValidated("a1", "Well done");
    });

    expect(result.current.outcome).toEqual(
      expect.objectContaining({
        actionId: "a1",
        status: "validated",
        narrativeNote: "Well done",
      })
    );
  });

  it("should set rejected outcome on onActionRejected", () => {
    const { result } = renderHook(() => useActionOutcomeNotification());

    act(() => {
      result.current.onActionRejected("a1", "Too far");
    });

    expect(result.current.outcome).toEqual(
      expect.objectContaining({
        actionId: "a1",
        status: "rejected",
        feedback: "Too far",
      })
    );
  });

  it("should clear outcome", () => {
    const { result } = renderHook(() => useActionOutcomeNotification());

    act(() => {
      result.current.onActionValidated("a1", null);
    });
    expect(result.current.outcome).not.toBeNull();

    act(() => {
      result.current.clearOutcome();
    });
    expect(result.current.outcome).toBeNull();
  });
});
