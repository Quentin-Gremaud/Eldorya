import { render } from "@testing-library/react";
import { TokenLayer } from "../token-layer";
import type { Token, FogZone } from "@/types/api";

// Mock react-konva
jest.mock("react-konva", () => ({
  Layer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layer">{children}</div>
  ),
  Group: ({
    children,
    draggable,
    ...props
  }: {
    children: React.ReactNode;
    draggable?: boolean;
    [key: string]: unknown;
  }) => (
    <div data-testid="token-group" data-draggable={draggable} {...props}>
      {children}
    </div>
  ),
  Circle: (props: Record<string, unknown>) => (
    <div data-testid="token-circle" data-fill={props.fill as string} />
  ),
  Text: (props: Record<string, unknown>) => (
    <div data-testid="token-label">{props.text as string}</div>
  ),
}));

const mockTokens: Token[] = [
  {
    id: "token-1",
    campaignId: "campaign-1",
    mapLevelId: "level-1",
    x: 100,
    y: 200,
    tokenType: "player",
    label: "Warrior",
    createdAt: "2026-03-09T10:00:00.000Z",
    updatedAt: "2026-03-09T10:00:00.000Z",
  },
  {
    id: "token-2",
    campaignId: "campaign-1",
    mapLevelId: "level-1",
    x: 300,
    y: 400,
    tokenType: "monster",
    label: "Dragon",
    createdAt: "2026-03-09T10:00:00.000Z",
    updatedAt: "2026-03-09T10:00:00.000Z",
  },
];

describe("TokenLayer", () => {
  it("should render a group for each token", () => {
    const { getAllByTestId } = render(
      <TokenLayer tokens={mockTokens} interactive={true} />
    );

    const groups = getAllByTestId("token-group");
    expect(groups).toHaveLength(2);
  });

  it("should render correct labels", () => {
    const { getAllByTestId } = render(
      <TokenLayer tokens={mockTokens} interactive={true} />
    );

    const labels = getAllByTestId("token-label");
    expect(labels[0].textContent).toBe("Warrior");
    expect(labels[1].textContent).toBe("Dragon");
  });

  it("should use correct colors by type", () => {
    const { getAllByTestId } = render(
      <TokenLayer tokens={mockTokens} interactive={true} />
    );

    const circles = getAllByTestId("token-circle");
    expect(circles[0].getAttribute("data-fill")).toBe("#34D399"); // player = emerald
    expect(circles[1].getAttribute("data-fill")).toBe("#EF4444"); // monster = red
  });

  it("should set draggable based on interactive prop", () => {
    const { getAllByTestId, rerender } = render(
      <TokenLayer tokens={mockTokens} interactive={true} />
    );

    let groups = getAllByTestId("token-group");
    expect(groups[0].getAttribute("data-draggable")).toBe("true");

    rerender(<TokenLayer tokens={mockTokens} interactive={false} />);
    groups = getAllByTestId("token-group");
    expect(groups[0].getAttribute("data-draggable")).toBe("false");
  });

  it("should render empty layer when no tokens", () => {
    const { queryAllByTestId } = render(
      <TokenLayer tokens={[]} interactive={true} />
    );

    expect(queryAllByTestId("token-group")).toHaveLength(0);
  });

  it("should set tokens non-draggable in preview mode", () => {
    const { getAllByTestId } = render(
      <TokenLayer tokens={mockTokens} interactive={false} viewMode="preview" />
    );

    const groups = getAllByTestId("token-group");
    expect(groups[0].getAttribute("data-draggable")).toBe("false");
    expect(groups[1].getAttribute("data-draggable")).toBe("false");
  });

  it("should keep tokens draggable in gm mode when interactive", () => {
    const { getAllByTestId } = render(
      <TokenLayer tokens={mockTokens} interactive={true} viewMode="gm" />
    );

    const groups = getAllByTestId("token-group");
    expect(groups[0].getAttribute("data-draggable")).toBe("true");
  });

  describe("fog-based visibility filtering", () => {
    const revealedZone: FogZone = {
      id: "fz-1",
      mapLevelId: "level-1",
      playerId: "p1",
      x: 50,
      y: 150,
      width: 200,
      height: 200,
      revealed: true,
      createdAt: "2026-03-10",
    };

    it("should filter tokens when fogZones provided in player mode", () => {
      // token-1 at (100, 200) is within revealedZone (50-250, 150-350)
      // token-2 at (300, 400) is outside revealedZone
      const { getAllByTestId } = render(
        <TokenLayer
          tokens={mockTokens}
          interactive={false}
          viewMode="player"
          fogZones={[revealedZone]}
        />
      );

      const groups = getAllByTestId("token-group");
      expect(groups).toHaveLength(1);

      const labels = getAllByTestId("token-label");
      expect(labels[0].textContent).toBe("Warrior");
    });

    it("should show all tokens when fogZones is empty", () => {
      const { getAllByTestId } = render(
        <TokenLayer
          tokens={mockTokens}
          interactive={false}
          viewMode="player"
          fogZones={[]}
        />
      );

      expect(getAllByTestId("token-group")).toHaveLength(2);
    });

    it("should show all tokens when fogZones is undefined", () => {
      const { getAllByTestId } = render(
        <TokenLayer
          tokens={mockTokens}
          interactive={false}
          viewMode="player"
        />
      );

      expect(getAllByTestId("token-group")).toHaveLength(2);
    });

    it("should show token on zone boundary (center on edge — inclusive)", () => {
      // token-1 at (100, 200), zone edge at x=100 (50+50 would be edge case)
      const edgeZone: FogZone = {
        id: "fz-edge",
        mapLevelId: "level-1",
        playerId: "p1",
        x: 100, // token-1.x === zone.x (left edge)
        y: 200, // token-1.y === zone.y (top edge)
        width: 10,
        height: 10,
        revealed: true,
        createdAt: "2026-03-10",
      };

      const { getAllByTestId } = render(
        <TokenLayer
          tokens={mockTokens}
          interactive={false}
          viewMode="player"
          fogZones={[edgeZone]}
        />
      );

      // token-1 at (100,200) is on the edge of zone (100,200)-(110,210) → visible (inclusive >=, <=)
      const labels = getAllByTestId("token-label");
      expect(labels).toHaveLength(1);
      expect(labels[0].textContent).toBe("Warrior");
    });

    it("should hide token when zone is removed (simulating WebSocket hide)", () => {
      const { getAllByTestId, queryAllByTestId, rerender } = render(
        <TokenLayer
          tokens={mockTokens}
          interactive={false}
          viewMode="player"
          fogZones={[revealedZone]}
        />
      );

      // token-1 visible, token-2 hidden
      expect(getAllByTestId("token-group")).toHaveLength(1);

      // Zone gets hidden (removed from revealed list) — simulates WebSocket FogZoneHidden
      rerender(
        <TokenLayer
          tokens={mockTokens}
          interactive={false}
          viewMode="player"
          fogZones={[{ ...revealedZone, revealed: false }]}
        />
      );

      // No tokens visible now
      expect(queryAllByTestId("token-group")).toHaveLength(0);
    });

    it("should not filter tokens in gm mode even with fogZones", () => {
      const { getAllByTestId } = render(
        <TokenLayer
          tokens={mockTokens}
          interactive={true}
          viewMode="gm"
          fogZones={[revealedZone]}
        />
      );

      expect(getAllByTestId("token-group")).toHaveLength(2);
    });
  });
});
