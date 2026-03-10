import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockSignOut = jest.fn();

jest.mock("@clerk/nextjs", () => ({
  useUser: () => ({
    user: { firstName: "Quentin", imageUrl: "https://img.clerk.com/avatar.png" },
  }),
  useClerk: () => ({ signOut: mockSignOut }),
}));

import { AppHeader } from "../app-header";

describe("AppHeader", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the Eldorya logo linking to dashboard", () => {
    render(<AppHeader />);

    const logoLink = screen.getByRole("link", { name: /eldorya/i });
    expect(logoLink).toHaveAttribute("href", "/dashboard");
  });

  it("renders user menu trigger button", () => {
    render(<AppHeader />);

    expect(screen.getByRole("button", { name: /user menu/i })).toBeInTheDocument();
  });

  it("displays user first name initial in avatar fallback", () => {
    render(<AppHeader />);

    expect(screen.getByText("Q")).toBeInTheDocument();
  });

  it("opens dropdown with Settings and Sign Out options", async () => {
    const user = userEvent.setup();
    render(<AppHeader />);

    await user.click(screen.getByRole("button", { name: /user menu/i }));

    expect(screen.getByRole("menuitem", { name: /settings/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /sign out/i })).toBeInTheDocument();
  });

  it("renders Settings as a link to /settings", async () => {
    const user = userEvent.setup();
    render(<AppHeader />);

    await user.click(screen.getByRole("button", { name: /user menu/i }));

    const settingsItem = screen.getByRole("menuitem", { name: /settings/i });
    expect(settingsItem.closest("a")).toHaveAttribute("href", "/settings");
  });

  it("calls signOut when Sign Out is clicked", async () => {
    const user = userEvent.setup();
    render(<AppHeader />);

    await user.click(screen.getByRole("button", { name: /user menu/i }));
    await user.click(screen.getByRole("menuitem", { name: /sign out/i }));

    expect(mockSignOut).toHaveBeenCalledWith({ redirectUrl: "/" });
  });
});
