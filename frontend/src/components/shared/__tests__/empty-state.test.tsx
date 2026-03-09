import { render, screen, fireEvent } from "@testing-library/react";
import { EmptyState } from "../empty-state";
import { createElement } from "react";

describe("EmptyState", () => {
  it("renders title and description", () => {
    render(
      <EmptyState
        icon={createElement("span", null, "icon")}
        title="No campaigns"
        description="You have not joined any campaigns yet."
      />
    );
    expect(screen.getByText("No campaigns")).toBeInTheDocument();
    expect(
      screen.getByText("You have not joined any campaigns yet.")
    ).toBeInTheDocument();
  });

  it("renders icon", () => {
    render(
      <EmptyState
        icon={createElement("span", { "data-testid": "test-icon" }, "icon")}
        title="Empty"
        description="Nothing here"
      />
    );
    expect(screen.getByTestId("test-icon")).toBeInTheDocument();
  });

  it("renders CTA button when action is provided", () => {
    const onClick = jest.fn();
    render(
      <EmptyState
        icon={createElement("span", null, "icon")}
        title="No campaigns"
        description="Start your journey"
        action={{ label: "Create Campaign", onClick }}
      />
    );
    const button = screen.getByText("Create Campaign");
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("hides CTA button when no action is provided", () => {
    render(
      <EmptyState
        icon={createElement("span", null, "icon")}
        title="No campaigns"
        description="Nothing to see here"
      />
    );
    expect(screen.queryByRole("button")).toBeNull();
  });
});
