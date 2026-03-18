import { render, screen, fireEvent } from "@testing-library/react";
import { PingNotification } from "../ping-notification";

const mockClearPing = jest.fn();

jest.mock("@/hooks/use-ping-notification", () => ({
  usePingNotification: jest.fn(() => ({
    isPinged: false,
    clearPing: mockClearPing,
  })),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { usePingNotification } = require("@/hooks/use-ping-notification");

describe("PingNotification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (usePingNotification as jest.Mock).mockReturnValue({
      isPinged: false,
      clearPing: mockClearPing,
    });
  });

  it("returns null when not pinged", () => {
    const { container } = render(
      <PingNotification campaignId="campaign-1" />
    );

    expect(container.firstChild).toBeNull();
  });

  it("shows notification when pinged", () => {
    (usePingNotification as jest.Mock).mockReturnValue({
      isPinged: true,
      clearPing: mockClearPing,
    });

    render(<PingNotification campaignId="campaign-1" />);

    expect(
      screen.getByText("The Master awaits your action!")
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("dismiss button calls clearPing", () => {
    (usePingNotification as jest.Mock).mockReturnValue({
      isPinged: true,
      clearPing: mockClearPing,
    });

    render(<PingNotification campaignId="campaign-1" />);

    fireEvent.click(screen.getByText("Dismiss"));

    expect(mockClearPing).toHaveBeenCalledTimes(1);
  });
});
