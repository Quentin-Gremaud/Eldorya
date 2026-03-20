import { render, screen } from "@testing-library/react";
import { PresenceIndicator } from "../presence-indicator";

describe("PresenceIndicator", () => {
  it("should render initials from display name", () => {
    render(<PresenceIndicator displayName="Alice Doe" status="online" />);

    expect(screen.getByText("AD")).toBeInTheDocument();
  });

  it("should render single initial for single name", () => {
    render(<PresenceIndicator displayName="Alice" status="online" />);

    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("should have aria-label with name and status", () => {
    render(<PresenceIndicator displayName="Alice" status="online" />);

    expect(screen.getByLabelText("Alice: online")).toBeInTheDocument();
  });

  it("should render with online status styling", () => {
    render(<PresenceIndicator displayName="Alice" status="online" />);

    const indicator = screen.getByLabelText("Alice: online");
    expect(indicator.className).toContain("ring-emerald-500");
  });

  it("should render with idle status styling", () => {
    render(<PresenceIndicator displayName="Alice" status="idle" />);

    const indicator = screen.getByLabelText("Alice: idle");
    expect(indicator.className).toContain("opacity-50");
  });

  it("should render with disconnected status styling", () => {
    render(<PresenceIndicator displayName="Alice" status="disconnected" />);

    const indicator = screen.getByLabelText("Alice: disconnected");
    expect(indicator.className).toContain("border-dashed");
  });

  it("should render with action-pending status styling", () => {
    render(<PresenceIndicator displayName="Alice" status="action-pending" />);

    const indicator = screen.getByLabelText("Alice: action-pending");
    expect(indicator.className).toContain("ring-amber-500");
    expect(indicator.className).toContain("animate-pulse");
  });

  it("should render small size", () => {
    render(<PresenceIndicator displayName="Alice" status="online" size="sm" />);

    const indicator = screen.getByLabelText("Alice: online");
    expect(indicator.className).toContain("h-7");
  });

  it("should render medium size by default", () => {
    render(<PresenceIndicator displayName="Alice" status="online" />);

    const indicator = screen.getByLabelText("Alice: online");
    expect(indicator.className).toContain("h-9");
  });
});
