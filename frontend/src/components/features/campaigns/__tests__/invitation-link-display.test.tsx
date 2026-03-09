import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InvitationLinkDisplay } from "../invitation-link-display";

const mockCopy = jest.fn();
let mockCopied = false;

jest.mock("@/hooks/use-copy-to-clipboard", () => ({
  useCopyToClipboard: () => ({
    copy: mockCopy,
    copied: mockCopied,
    error: null,
  }),
}));

describe("InvitationLinkDisplay", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    mockCopied = false;
  });

  it("should display the invitation URL", () => {
    render(
      <InvitationLinkDisplay
        inviteUrl="http://localhost:3000/invite/abc123token"
        createdAt="2026-03-01T12:00:00Z"
        expiresAt="2026-03-08T12:00:00Z"
      />
    );

    expect(
      screen.getByText("http://localhost:3000/invite/abc123token")
    ).toBeInTheDocument();
  });

  it("should display creation date", () => {
    render(
      <InvitationLinkDisplay
        inviteUrl="http://localhost:3000/invite/abc123token"
        createdAt="2026-03-01T12:00:00Z"
        expiresAt="2026-03-08T12:00:00Z"
      />
    );

    expect(screen.getByText(/Created/)).toBeInTheDocument();
  });

  it("should display expiry date when provided", () => {
    render(
      <InvitationLinkDisplay
        inviteUrl="http://localhost:3000/invite/abc123token"
        createdAt="2026-03-01T12:00:00Z"
        expiresAt="2026-03-08T12:00:00Z"
      />
    );

    expect(screen.getByText(/Expires/)).toBeInTheDocument();
  });

  it("should not display expiry when null", () => {
    render(
      <InvitationLinkDisplay
        inviteUrl="http://localhost:3000/invite/abc123token"
        createdAt="2026-03-01T12:00:00Z"
        expiresAt={null}
      />
    );

    expect(screen.queryByText(/Expires/)).toBeNull();
  });

  it("should call copy when copy button is clicked", async () => {
    render(
      <InvitationLinkDisplay
        inviteUrl="http://localhost:3000/invite/abc123token"
        createdAt="2026-03-01T12:00:00Z"
        expiresAt="2026-03-08T12:00:00Z"
      />
    );

    const copyBtn = screen.getByLabelText("Copy invitation link");
    await user.click(copyBtn);

    expect(mockCopy).toHaveBeenCalledWith(
      "http://localhost:3000/invite/abc123token"
    );
  });
});
