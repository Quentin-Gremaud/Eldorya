import { createAuthenticatedSocket } from "../socket-client";

jest.mock("socket.io-client", () => ({
  io: jest.fn(() => ({
    id: "mock-socket-id",
    connected: false,
    on: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
  })),
}));

import { io } from "socket.io-client";

const mockedIo = io as jest.MockedFunction<typeof io>;

describe("createAuthenticatedSocket", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a socket with autoConnect disabled", () => {
    const getToken = jest.fn();
    createAuthenticatedSocket(getToken);

    expect(mockedIo).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ autoConnect: false })
    );
  });

  it("passes an async auth callback that retrieves the JWT token", async () => {
    const getToken = jest.fn().mockResolvedValue("my-jwt-token");
    createAuthenticatedSocket(getToken);

    const callArgs = mockedIo.mock.calls[0][1] as { auth: (cb: (data: { token: string | null }) => void) => Promise<void> };
    const authFn = callArgs.auth;

    const cb = jest.fn();
    await authFn(cb);

    expect(getToken).toHaveBeenCalled();
    expect(cb).toHaveBeenCalledWith({ token: "my-jwt-token" });
  });

  it("passes null token when getToken returns null", async () => {
    const getToken = jest.fn().mockResolvedValue(null);
    createAuthenticatedSocket(getToken);

    const callArgs = mockedIo.mock.calls[0][1] as { auth: (cb: (data: { token: string | null }) => void) => Promise<void> };
    const authFn = callArgs.auth;

    const cb = jest.fn();
    await authFn(cb);

    expect(cb).toHaveBeenCalledWith({ token: null });
  });

  it("connects to the configured backend URL", () => {
    const getToken = jest.fn();
    createAuthenticatedSocket(getToken);

    expect(mockedIo).toHaveBeenCalledWith(
      "http://localhost:3001",
      expect.any(Object)
    );
  });
});
