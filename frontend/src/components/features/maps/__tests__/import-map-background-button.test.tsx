import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ImportMapBackgroundButton } from "../import-map-background-button";

const mockUpload = jest.fn();
const mockReset = jest.fn();
let mockStatus = "idle";
let mockIsUploading = false;

jest.mock("@/hooks/use-upload-map-background", () => ({
  useUploadMapBackground: () => ({
    upload: mockUpload,
    status: mockStatus,
    isUploading: mockIsUploading,
    error: null,
    reset: mockReset,
  }),
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const { toast } = jest.requireMock("sonner");

describe("ImportMapBackgroundButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStatus = "idle";
    mockIsUploading = false;
    mockUpload.mockResolvedValue(undefined);
  });

  it("should render the import button", () => {
    render(
      <ImportMapBackgroundButton campaignId="c1" mapLevelId="l1" />
    );
    expect(screen.getByText("Import Background")).toBeInTheDocument();
  });

  it("should trigger file input on button click", () => {
    render(
      <ImportMapBackgroundButton campaignId="c1" mapLevelId="l1" />
    );

    const button = screen.getByText("Import Background");
    fireEvent.click(button);

    // The file input should exist
    const input = screen.getByTestId("file-input");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("accept", ".jpg,.jpeg,.png,.webp");
  });

  it("should reject files exceeding 5MB", async () => {
    render(
      <ImportMapBackgroundButton campaignId="c1" mapLevelId="l1" />
    );

    const input = screen.getByTestId("file-input");
    const largeFile = new File([new ArrayBuffer(6 * 1024 * 1024)], "big.jpg", {
      type: "image/jpeg",
    });

    fireEvent.change(input, { target: { files: [largeFile] } });

    expect(toast.error).toHaveBeenCalledWith("File size exceeds 5MB limit.");
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it("should reject unsupported file types", async () => {
    render(
      <ImportMapBackgroundButton campaignId="c1" mapLevelId="l1" />
    );

    const input = screen.getByTestId("file-input");
    const gifFile = new File([new ArrayBuffer(100)], "test.gif", {
      type: "image/gif",
    });

    fireEvent.change(input, { target: { files: [gifFile] } });

    expect(toast.error).toHaveBeenCalledWith(
      "Unsupported file format. Please use JPG, PNG, or WebP."
    );
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it("should call upload with valid file", async () => {
    render(
      <ImportMapBackgroundButton campaignId="c1" mapLevelId="l1" />
    );

    const input = screen.getByTestId("file-input");
    const validFile = new File([new ArrayBuffer(1024)], "test.jpg", {
      type: "image/jpeg",
    });

    fireEvent.change(input, { target: { files: [validFile] } });

    await waitFor(() => {
      expect(mockUpload).toHaveBeenCalledTimes(1);
    });
    expect(mockUpload).toHaveBeenCalledWith(validFile);
  });

  it("should show success toast on upload complete", async () => {
    render(
      <ImportMapBackgroundButton campaignId="c1" mapLevelId="l1" />
    );

    const input = screen.getByTestId("file-input");
    const validFile = new File([new ArrayBuffer(1024)], "test.png", {
      type: "image/png",
    });

    fireEvent.change(input, { target: { files: [validFile] } });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Background image imported!"
      );
    });
  });

  it("should show error toast on upload failure", async () => {
    mockUpload.mockRejectedValue(new Error("Failed"));

    render(
      <ImportMapBackgroundButton campaignId="c1" mapLevelId="l1" />
    );

    const input = screen.getByTestId("file-input");
    const validFile = new File([new ArrayBuffer(1024)], "test.jpg", {
      type: "image/jpeg",
    });

    fireEvent.change(input, { target: { files: [validFile] } });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Failed to import background image."
      );
    });
  });

  it("should disable button during upload", () => {
    mockIsUploading = true;
    mockStatus = "uploading";

    render(
      <ImportMapBackgroundButton campaignId="c1" mapLevelId="l1" />
    );

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(screen.getByText("Uploading...")).toBeInTheDocument();
  });
});
