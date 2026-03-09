import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { NotificationPanel } from "../notification-panel";

const mockUseNotifications = jest.fn();
const mockMarkRead = jest.fn();
const mockPush = jest.fn();

jest.mock("@/hooks/use-notifications", () => ({
  useNotifications: () => mockUseNotifications(),
}));

jest.mock("@/hooks/use-mark-notification-read", () => ({
  useMarkNotificationRead: () => ({
    mutate: mockMarkRead,
  }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("@/lib/utils", () => ({
  ...jest.requireActual("@/lib/utils"),
  formatRelativeDate: () => "5 min ago",
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe("NotificationPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders notification list", () => {
    mockUseNotifications.mockReturnValue({
      notifications: [
        {
          id: "n-1",
          type: "campaign_announcement",
          title: "New announcement from GM",
          content: "Hello!",
          campaignId: "campaign-123",
          referenceId: "ann-1",
          isRead: false,
          createdAt: "2026-03-07T10:00:00Z",
        },
      ],
      unreadCount: 1,
    });

    render(
      <NotificationPanel isOpen={true} onClose={jest.fn()} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText("New announcement from GM")).toBeInTheDocument();
    expect(screen.getByText("Hello!")).toBeInTheDocument();
  });

  it("shows empty state when no notifications", () => {
    mockUseNotifications.mockReturnValue({
      notifications: [],
      unreadCount: 0,
    });

    render(
      <NotificationPanel isOpen={true} onClose={jest.fn()} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText("No notifications")).toBeInTheDocument();
  });

  it("marks as read and navigates on click", () => {
    const onClose = jest.fn();
    mockUseNotifications.mockReturnValue({
      notifications: [
        {
          id: "n-1",
          type: "campaign_announcement",
          title: "New announcement",
          content: "Content",
          campaignId: "campaign-123",
          referenceId: "ann-1",
          isRead: false,
          createdAt: "2026-03-07T10:00:00Z",
        },
      ],
      unreadCount: 1,
    });

    render(
      <NotificationPanel isOpen={true} onClose={onClose} />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByText("New announcement"));

    expect(mockMarkRead).toHaveBeenCalledWith("n-1");
    expect(mockPush).toHaveBeenCalledWith("/campaign/campaign-123/player");
    expect(onClose).toHaveBeenCalled();
  });

  it("shows mark all read button when there are unread notifications", () => {
    mockUseNotifications.mockReturnValue({
      notifications: [
        {
          id: "n-1",
          type: "campaign_announcement",
          title: "Title",
          content: "Content",
          campaignId: null,
          referenceId: null,
          isRead: false,
          createdAt: "2026-03-07T10:00:00Z",
        },
      ],
      unreadCount: 1,
    });

    render(
      <NotificationPanel isOpen={true} onClose={jest.fn()} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText("Mark all read")).toBeInTheDocument();
  });
});
