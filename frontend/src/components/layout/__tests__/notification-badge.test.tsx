import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { NotificationBadge } from "../notification-badge";

const mockUseNotifications = jest.fn();

jest.mock("@/hooks/use-notifications", () => ({
  useNotifications: () => mockUseNotifications(),
}));

jest.mock("@/hooks/use-mark-notification-read", () => ({
  useMarkNotificationRead: () => ({
    mutate: jest.fn(),
  }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe("NotificationBadge", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders bell icon", () => {
    mockUseNotifications.mockReturnValue({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      isError: false,
    });

    render(<NotificationBadge />, { wrapper: createWrapper() });

    expect(screen.getByLabelText("Notifications")).toBeInTheDocument();
  });

  it("shows unread count badge when there are unread notifications", () => {
    mockUseNotifications.mockReturnValue({
      notifications: [],
      unreadCount: 3,
      isLoading: false,
      isError: false,
    });

    render(<NotificationBadge />, { wrapper: createWrapper() });

    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("does not show badge when unread count is 0", () => {
    mockUseNotifications.mockReturnValue({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      isError: false,
    });

    render(<NotificationBadge />, { wrapper: createWrapper() });

    expect(screen.queryByText("0")).toBeNull();
  });

  it("toggles notification panel on click", () => {
    mockUseNotifications.mockReturnValue({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      isError: false,
    });

    render(<NotificationBadge />, { wrapper: createWrapper() });

    const button = screen.getByLabelText("Notifications");
    fireEvent.click(button);

    // Panel should open (Sheet renders Notifications title)
    expect(screen.getByText("Notifications")).toBeInTheDocument();
  });
});
