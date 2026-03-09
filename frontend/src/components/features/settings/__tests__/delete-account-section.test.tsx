import { render, screen, fireEvent } from "@testing-library/react";
import { DeleteAccountSection } from "../delete-account-section";

const mockDeleteAccount = jest.fn();
const mockUseAccountDeletion = jest.fn();

jest.mock("@/hooks/use-account-deletion", () => ({
  useAccountDeletion: () => mockUseAccountDeletion(),
}));

describe("DeleteAccountSection", () => {
  const defaultHookReturn = {
    activeCampaigns: { count: 0, campaigns: [] },
    isLoadingCampaigns: false,
    deleteAccount: mockDeleteAccount,
    isDeleting: false,
    deleteError: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAccountDeletion.mockReturnValue(defaultHookReturn);
  });

  it("should render the Danger Zone heading", () => {
    render(<DeleteAccountSection />);

    expect(screen.getByText("Danger Zone")).toBeInTheDocument();
  });

  it("should render warning text about irreversible deletion", () => {
    render(<DeleteAccountSection />);

    expect(
      screen.getByText(/permanent and cannot be undone/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/crypto-shredding/i)
    ).toBeInTheDocument();
  });

  it("should render the Delete My Account button", () => {
    render(<DeleteAccountSection />);

    expect(
      screen.getByRole("button", { name: /delete my account/i })
    ).toBeInTheDocument();
  });

  it("should show campaign warning when user has active campaigns as GM", () => {
    mockUseAccountDeletion.mockReturnValue({
      ...defaultHookReturn,
      activeCampaigns: {
        count: 2,
        campaigns: [
          { id: "1", name: "Dragon Quest" },
          { id: "2", name: "Sword Coast" },
        ],
      },
    });

    render(<DeleteAccountSection />);

    expect(screen.getByText("Dragon Quest")).toBeInTheDocument();
    expect(screen.getByText("Sword Coast")).toBeInTheDocument();
    expect(
      screen.getByText(/campaigns will become permanently inaccessible/i)
    ).toBeInTheDocument();
  });

  it("should not show campaign warning when user has no active campaigns", () => {
    render(<DeleteAccountSection />);

    expect(
      screen.queryByText(/campaigns will become permanently inaccessible/i)
    ).not.toBeInTheDocument();
  });

  it("should open confirmation dialog on button click", () => {
    render(<DeleteAccountSection />);

    fireEvent.click(
      screen.getByRole("button", { name: /delete my account/i })
    );

    expect(
      screen.getByText("Are you absolutely sure?")
    ).toBeInTheDocument();
  });

  it("should have delete button disabled until DELETE is typed", () => {
    render(<DeleteAccountSection />);

    fireEvent.click(
      screen.getByRole("button", { name: /delete my account/i })
    );

    // Find the dialog action button (inside AlertDialogFooter)
    const allDeleteButtons = screen.getAllByRole("button", {
      name: /delete my account/i,
    });
    const dialogDeleteButton = allDeleteButtons[allDeleteButtons.length - 1];
    expect(dialogDeleteButton).toBeDisabled();

    const input = screen.getByPlaceholderText("DELETE");
    fireEvent.change(input, { target: { value: "DELETE" } });

    expect(dialogDeleteButton).not.toBeDisabled();
  });

  it("should call deleteAccount mutation on confirm", () => {
    render(<DeleteAccountSection />);

    fireEvent.click(
      screen.getByRole("button", { name: /delete my account/i })
    );

    const input = screen.getByPlaceholderText("DELETE");
    fireEvent.change(input, { target: { value: "DELETE" } });

    const allDeleteButtons = screen.getAllByRole("button", {
      name: /delete my account/i,
    });
    const dialogDeleteButton = allDeleteButtons[allDeleteButtons.length - 1];
    fireEvent.click(dialogDeleteButton);

    expect(mockDeleteAccount).toHaveBeenCalledTimes(1);
  });

  it("should show loading state during deletion", () => {
    mockUseAccountDeletion.mockReturnValue({
      ...defaultHookReturn,
      isDeleting: true,
    });

    render(<DeleteAccountSection />);

    fireEvent.click(
      screen.getByRole("button", { name: /delete my account/i })
    );

    expect(screen.getByText("Deleting...")).toBeInTheDocument();
  });

  it("should show error message when deletion fails", () => {
    mockUseAccountDeletion.mockReturnValue({
      ...defaultHookReturn,
      deleteError: new Error("Server error"),
    });

    render(<DeleteAccountSection />);

    expect(
      screen.getByText(/error occurred while deleting/i)
    ).toBeInTheDocument();
  });
});
