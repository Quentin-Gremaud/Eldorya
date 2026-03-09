import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { CreateCampaignForm } from "../create-campaign-form";

const mockMutate = jest.fn();

jest.mock("@/hooks/use-create-campaign", () => ({
  useCreateCampaign: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };
}

describe("CreateCampaignForm", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the form when open", () => {
    render(
      <CreateCampaignForm open={true} onOpenChange={jest.fn()} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText("Create a new campaign")).toBeInTheDocument();
    expect(screen.getByLabelText("Campaign Name")).toBeInTheDocument();
  });

  it("should not render when closed", () => {
    render(
      <CreateCampaignForm open={false} onOpenChange={jest.fn()} />,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByText("Create a new campaign")).toBeNull();
  });

  it("should submit with valid data", async () => {
    mockMutate.mockImplementation((_data: unknown, opts: { onSuccess?: () => void }) => {
      opts?.onSuccess?.();
    });

    const onOpenChange = jest.fn();

    render(
      <CreateCampaignForm open={true} onOpenChange={onOpenChange} />,
      { wrapper: createWrapper() }
    );

    const nameInput = screen.getByLabelText("Campaign Name");
    await user.type(nameInput, "My New Campaign");

    const submitButton = screen.getByText("Create Campaign");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledTimes(1);
    });

    const call = mockMutate.mock.calls[0][0];
    expect(call.name).toBe("My New Campaign");
    expect(call.id).toBeDefined();
  });

  it("should show validation error for empty name", async () => {
    render(
      <CreateCampaignForm open={true} onOpenChange={jest.fn()} />,
      { wrapper: createWrapper() }
    );

    const submitButton = screen.getByText("Create Campaign");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Campaign name is required")).toBeInTheDocument();
    });

    expect(mockMutate).not.toHaveBeenCalled();
  });
});
