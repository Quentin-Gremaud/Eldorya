import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { AnnouncementComposer } from "../announcement-composer";

const mockMutate = jest.fn();

jest.mock("@clerk/nextjs", () => ({
  useUser: () => ({
    user: { firstName: "John", lastName: "Doe" },
  }),
}));

jest.mock("@/hooks/use-send-announcement", () => ({
  useSendAnnouncement: () => ({
    mutate: mockMutate,
    isPending: false,
    isError: false,
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

describe("AnnouncementComposer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders form with textarea and submit button", () => {
    render(<AnnouncementComposer campaignId="campaign-123" />, {
      wrapper: createWrapper(),
    });

    expect(
      screen.getByPlaceholderText(
        "Write an announcement for your players..."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Send Announcement")).toBeInTheDocument();
  });

  it("shows character count", () => {
    render(<AnnouncementComposer campaignId="campaign-123" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText("0/2000")).toBeInTheDocument();
  });

  it("submit button is disabled when content is empty", () => {
    render(<AnnouncementComposer campaignId="campaign-123" />, {
      wrapper: createWrapper(),
    });

    const button = screen.getByRole("button", { name: /send announcement/i });
    expect((button as HTMLButtonElement).disabled).toBe(true);
  });

  it("submits the form with valid content", async () => {
    render(<AnnouncementComposer campaignId="campaign-123" />, {
      wrapper: createWrapper(),
    });

    const textarea = screen.getByPlaceholderText(
      "Write an announcement for your players..."
    );
    await userEvent.type(textarea, "Hello players!");

    const button = screen.getByRole("button", { name: /send announcement/i });
    await userEvent.click(button);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledTimes(1);
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          content: "Hello players!",
        }),
        expect.any(Object)
      );
    });
  });
});
