import { apiClient } from "../client";

describe("apiClient", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("includes Authorization Bearer header when token is provided", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: "test" }),
    });

    await apiClient("/api/test", { token: "my-jwt-token" });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3001/api/test",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer my-jwt-token",
        }),
      })
    );
  });

  it("does not include Authorization header when no token provided", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: "test" }),
    });

    await apiClient("/api/test");

    const callArgs = (global.fetch as jest.Mock).mock.calls[0][1];
    expect(callArgs.headers).not.toHaveProperty("Authorization");
  });

  it("returns undefined for 202 status responses", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 202,
    });

    const result = await apiClient("/api/command");

    expect(result).toBeUndefined();
  });

  it("throws error for non-ok responses", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ message: "Unauthorized" }),
    });

    await expect(apiClient("/api/protected")).rejects.toEqual({
      message: "Unauthorized",
    });
  });
});
