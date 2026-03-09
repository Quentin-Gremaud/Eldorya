import { render, screen } from "@testing-library/react";
import { AnnouncementList } from "../announcement-list";

jest.mock("@/lib/utils", () => ({
  ...jest.requireActual("@/lib/utils"),
  formatRelativeDate: () => "2 hours ago",
}));

describe("AnnouncementList", () => {
  const announcements = [
    {
      id: "ann-1",
      content: "Session tonight at 8pm!",
      gmDisplayName: "John Doe",
      createdAt: "2026-03-07T10:00:00Z",
    },
    {
      id: "ann-2",
      content: "New character rules update",
      gmDisplayName: "John Doe",
      createdAt: "2026-03-06T14:00:00Z",
    },
  ];

  it("renders announcements with GM name and timestamp", () => {
    render(
      <AnnouncementList
        announcements={announcements}
        isLoading={false}
        role="gm"
      />
    );

    expect(screen.getByText("Session tonight at 8pm!")).toBeInTheDocument();
    expect(screen.getByText("New character rules update")).toBeInTheDocument();
    expect(screen.getAllByText("John Doe")).toHaveLength(2);
    expect(screen.getAllByText("2 hours ago")).toHaveLength(2);
  });

  it("shows GM empty state message", () => {
    render(
      <AnnouncementList announcements={[]} isLoading={false} role="gm" />
    );

    expect(screen.getByText("No announcements yet")).toBeInTheDocument();
    expect(
      screen.getByText("Send your first announcement to your players")
    ).toBeInTheDocument();
  });

  it("shows player empty state message", () => {
    render(
      <AnnouncementList announcements={[]} isLoading={false} role="player" />
    );

    expect(screen.getByText("No announcements yet")).toBeInTheDocument();
    expect(
      screen.getByText("No announcements from your GM yet")
    ).toBeInTheDocument();
  });

  it("shows loading skeleton", () => {
    const { container } = render(
      <AnnouncementList announcements={[]} isLoading={true} role="gm" />
    );

    // Skeleton elements should be present
    expect(container.querySelectorAll("[data-slot='skeleton']").length).toBeGreaterThan(0);
  });
});
