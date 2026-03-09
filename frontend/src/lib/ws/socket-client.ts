import { io, Socket } from "socket.io-client";

const WS_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

export function createAuthenticatedSocket(
  getToken: () => Promise<string | null>
): Socket {
  const socket = io(WS_URL, {
    autoConnect: false,
    auth: async (cb) => {
      const token = await getToken();
      cb({ token });
    },
  });

  return socket;
}
