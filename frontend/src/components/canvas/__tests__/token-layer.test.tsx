import { render } from "@testing-library/react";
import { TokenLayer } from "../token-layer";
import type { Token } from "@/types/api";

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
});
