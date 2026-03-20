import { render, screen } from "@testing-library/react";

const mockPathname = jest.fn();
jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}));

jest.mock("@/components/shared/presence-indicator", () => ({
  PresenceIndicator: ({ displayName, status }: { displayName: string; status: string }) => (
    <div data-testid={`presence-${displayName}`}>{displayName} ({status})</div>
  ),
}));

import { GmSidebar } from "../gm-sidebar";

describe("GmSidebar", () => {
  const campaignId = "camp-123";

  beforeEach(() => {
    mockPathname.mockReturnValue(`/campaign/${campaignId}/gm/session`);
  });

  it("should render all navigation items", () => {
    render(<GmSidebar campaignId={campaignId} />);

    expect(screen.getByText("Session Live")).toBeInTheDocument();
    expect(screen.getByText("Players")).toBeInTheDocument();
    expect(screen.getByText("NPCs")).toBeInTheDocument();
    expect(screen.getByText("Chat")).toBeInTheDocument();
    expect(screen.getByText("Prep Mode")).toBeInTheDocument();
  });

  it("should highlight active navigation item", () => {
    mockPathname.mockReturnValue(`/campaign/${campaignId}/gm/session`);
    render(<GmSidebar campaignId={campaignId} />);

    const sessionLink = screen.getByText("Session Live").closest("a");
    expect(sessionLink).toHaveAttribute("aria-current", "page");
  });

  it("should not highlight inactive navigation items", () => {
    mockPathname.mockReturnValue(`/campaign/${campaignId}/gm/session`);
    render(<GmSidebar campaignId={campaignId} />);

    const playersLink = screen.getByText("Players").closest("a");
    expect(playersLink).not.toHaveAttribute("aria-current");
  });

  it("should show notification badge with pending action count", () => {
    render(<GmSidebar campaignId={campaignId} pendingActionsCount={5} />);

    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("should not show notification badge when count is 0", () => {
    render(<GmSidebar campaignId={campaignId} pendingActionsCount={0} />);

    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("should render connected players in footer", () => {
    render(
      <GmSidebar
        campaignId={campaignId}
        players={[
          { userId: "u1", displayName: "Alice", status: "online" },
          { userId: "u2", displayName: "Bob", status: "idle" },
        ]}
      />
    );

    expect(screen.getByText("Connected Players")).toBeInTheDocument();
    expect(screen.getByTestId("presence-Alice")).toBeInTheDocument();
    expect(screen.getByTestId("presence-Bob")).toBeInTheDocument();
  });

  it("should have correct navigation links", () => {
    render(<GmSidebar campaignId={campaignId} />);

    const sessionLink = screen.getByText("Session Live").closest("a");
    expect(sessionLink).toHaveAttribute("href", `/campaign/${campaignId}/gm/session`);

    const playersLink = screen.getByText("Players").closest("a");
    expect(playersLink).toHaveAttribute("href", `/campaign/${campaignId}/gm/players`);

    const prepLink = screen.getByText("Prep Mode").closest("a");
    expect(prepLink).toHaveAttribute("href", `/campaign/${campaignId}/gm/prep`);
  });

  it("should have aria-label on sidebar", () => {
    render(<GmSidebar campaignId={campaignId} />);

    expect(screen.getByLabelText("GM cockpit navigation")).toBeInTheDocument();
  });
});
