import { render, screen } from "@testing-library/react";

jest.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ getToken: jest.fn().mockResolvedValue("mock-token") }),
  useClerk: () => ({ signOut: jest.fn() }),
  useUser: () => ({ user: { id: "user-1" } }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/components/features/settings/delete-account-section", () => ({
  DeleteAccountSection: () => <div data-testid="delete-account">Delete Account</div>,
}));

import SettingsPage from "../page";

describe("SettingsPage", () => {
  it("renders breadcrumb with Dashboard and Settings", () => {
    render(<SettingsPage />);

    expect(screen.getByLabelText("breadcrumb")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("href", "/dashboard");
  });

  it("renders back button linking to dashboard", () => {
    render(<SettingsPage />);

    const backButton = screen.getByLabelText("Go back");
    expect(backButton).toHaveAttribute("href", "/dashboard");
  });

  it("renders Settings heading", () => {
    render(<SettingsPage />);

    expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
  });

  it("renders delete account section", () => {
    render(<SettingsPage />);

    expect(screen.getByTestId("delete-account")).toBeInTheDocument();
  });
});
