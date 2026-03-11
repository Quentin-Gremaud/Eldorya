import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FogPlayerSelector } from "../fog-player-selector";
import type { PlayerOnboardingItem } from "@/types/api";

// Mock shadcn Select
jest.mock("@/components/ui/select", () => ({
  Select: ({ children, value, onValueChange }: { children: React.ReactNode; value?: string; onValueChange?: (v: string) => void }) => (
    <div data-testid="select-root" data-value={value}>
      {children}
      <input
        data-testid="select-input"
        value={value ?? ""}
        onChange={(e) => onValueChange?.(e.target.value)}
        readOnly
      />
    </div>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => (
    <button data-testid="select-trigger">{children}</button>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => (
    <span data-testid="select-value">{placeholder}</span>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="select-content">{children}</div>
  ),
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <div data-testid={`select-item-${value}`} data-value={value}>
      {children}
    </div>
  ),
}));

const mockPlayers: PlayerOnboardingItem[] = [
  {
    userId: "player-1",
    displayName: "Alice",
    status: "ready",
    joinedAt: "2026-03-10T10:00:00.000Z",
  },
  {
    userId: "player-2",
    displayName: "Bob",
    status: "joined",
    joinedAt: "2026-03-10T11:00:00.000Z",
  },
];

describe("FogPlayerSelector", () => {
  it("should render player list when visible", () => {
    render(
      <FogPlayerSelector
        players={mockPlayers}
        selectedPlayerId="player-1"
        onPlayerChange={jest.fn()}
        visible={true}
      />
    );

    expect(screen.getByTestId("fog-player-selector")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("should not render when visible is false", () => {
    render(
      <FogPlayerSelector
        players={mockPlayers}
        selectedPlayerId="player-1"
        onPlayerChange={jest.fn()}
        visible={false}
      />
    );

    expect(screen.queryByTestId("fog-player-selector")).not.toBeInTheDocument();
  });

  it("should not render when players list is empty", () => {
    render(
      <FogPlayerSelector
        players={[]}
        selectedPlayerId={null}
        onPlayerChange={jest.fn()}
        visible={true}
      />
    );

    expect(screen.queryByTestId("fog-player-selector")).not.toBeInTheDocument();
  });

  it("should show selected player value", () => {
    render(
      <FogPlayerSelector
        players={mockPlayers}
        selectedPlayerId="player-1"
        onPlayerChange={jest.fn()}
        visible={true}
      />
    );

    const selectRoot = screen.getByTestId("select-root");
    expect(selectRoot.getAttribute("data-value")).toBe("player-1");
  });

  it("should display 'Reveal for:' label", () => {
    render(
      <FogPlayerSelector
        players={mockPlayers}
        selectedPlayerId="player-1"
        onPlayerChange={jest.fn()}
        visible={true}
      />
    );

    expect(screen.getByText("Reveal for:")).toBeInTheDocument();
  });
});
