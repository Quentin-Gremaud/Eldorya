import { render, screen, fireEvent } from "@testing-library/react";
import { MapControls } from "../map-controls";

describe("MapControls", () => {
  it("should render zoom in, zoom out, and reset buttons", () => {
    render(
      <MapControls
        onZoomIn={jest.fn()}
        onZoomOut={jest.fn()}
        onResetZoom={jest.fn()}
      />
    );

    expect(screen.getByTitle("Zoom in")).toBeInTheDocument();
    expect(screen.getByTitle("Zoom out")).toBeInTheDocument();
    expect(screen.getByTitle("Reset zoom")).toBeInTheDocument();
  });

  it("should call onZoomIn when zoom in button is clicked", () => {
    const onZoomIn = jest.fn();
    render(
      <MapControls
        onZoomIn={onZoomIn}
        onZoomOut={jest.fn()}
        onResetZoom={jest.fn()}
      />
    );

    fireEvent.click(screen.getByTitle("Zoom in"));
    expect(onZoomIn).toHaveBeenCalledTimes(1);
  });

  it("should call onZoomOut when zoom out button is clicked", () => {
    const onZoomOut = jest.fn();
    render(
      <MapControls
        onZoomIn={jest.fn()}
        onZoomOut={onZoomOut}
        onResetZoom={jest.fn()}
      />
    );

    fireEvent.click(screen.getByTitle("Zoom out"));
    expect(onZoomOut).toHaveBeenCalledTimes(1);
  });

  it("should call onResetZoom when reset button is clicked", () => {
    const onResetZoom = jest.fn();
    render(
      <MapControls
        onZoomIn={jest.fn()}
        onZoomOut={jest.fn()}
        onResetZoom={onResetZoom}
      />
    );

    fireEvent.click(screen.getByTitle("Reset zoom"));
    expect(onResetZoom).toHaveBeenCalledTimes(1);
  });
});
