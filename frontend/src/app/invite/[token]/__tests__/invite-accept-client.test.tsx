import { render, screen, waitFor } from "@testing-library/react";
import { InviteAcceptClient } from "../invite-accept-client";

const mockAccept = jest.fn();
const mockUseAcceptInvitation = jest.fn();

jest.mock("@/hooks/use-accept-invitation", () => ({
  useAcceptInvitation: (token: string) => mockUseAcceptInvitation(token),
}));

jest.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ getToken: () => Promise.resolve("mock-token") }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe("InviteAcceptClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render loading state and call accept on mount", async () => {
    mockUseAcceptInvitation.mockReturnValue({
      accept: mockAccept,
      isPending: true,
      error: null,
    });

    render(
      <InviteAcceptClient token="my-token" campaignName="Dragon Quest" />
    );

    expect(screen.getByText("Joining Dragon Quest...")).toBeInTheDocument();

    await waitFor(() => {
      expect(mockAccept).toHaveBeenCalled();
    });
  });

  it("should call accept mutation exactly once on mount (useRef guard)", async () => {
    mockUseAcceptInvitation.mockReturnValue({
      accept: mockAccept,
      isPending: true,
      error: null,
    });

    render(
      <InviteAcceptClient token="my-token" campaignName="Dragon Quest" />
    );

    await waitFor(() => {
      expect(mockAccept).toHaveBeenCalledTimes(1);
    });
  });

  it("should not call accept again on re-render", async () => {
    mockUseAcceptInvitation.mockReturnValue({
      accept: mockAccept,
      isPending: true,
      error: null,
    });

    const { rerender } = render(
      <InviteAcceptClient token="my-token" campaignName="Dragon Quest" />
    );

    await waitFor(() => {
      expect(mockAccept).toHaveBeenCalledTimes(1);
    });

    rerender(
      <InviteAcceptClient token="my-token" campaignName="Dragon Quest" />
    );

    expect(mockAccept).toHaveBeenCalledTimes(1);
  });

  it("should show error state with retry button on failure", async () => {
    mockUseAcceptInvitation.mockReturnValue({
      accept: mockAccept,
      isPending: false,
      error: { message: "Invitation already used" },
    });

    render(
      <InviteAcceptClient token="my-token" campaignName="Dragon Quest" />
    );

    expect(screen.getByText("Unable to join campaign")).toBeInTheDocument();
    expect(screen.getByText("Invitation already used")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
    expect(screen.getByText("Go to Dashboard")).toBeInTheDocument();
  });

  it("should pass correct token to useAcceptInvitation", async () => {
    mockUseAcceptInvitation.mockReturnValue({
      accept: mockAccept,
      isPending: true,
      error: null,
    });

    render(
      <InviteAcceptClient token="specific-token" campaignName="Test Campaign" />
    );

    expect(mockUseAcceptInvitation).toHaveBeenCalledWith("specific-token");
  });

  it("should show redirecting state after successful mutation", async () => {
    mockUseAcceptInvitation.mockReturnValue({
      accept: mockAccept,
      isPending: false,
      error: null,
    });

    render(
      <InviteAcceptClient token="my-token" campaignName="Dragon Quest" />
    );

    expect(screen.getByText("Redirecting...")).toBeInTheDocument();
    expect(
      screen.getByText("You have been added to the campaign.")
    ).toBeInTheDocument();
  });
});
