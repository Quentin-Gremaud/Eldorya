const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

export async function apiClient<T>(
  path: string,
  options?: RequestInit & { token?: string }
): Promise<T> {
  const { token, ...fetchOptions } = options ?? {};

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    let error;
    try {
      error = await response.json();
    } catch {
      error = { statusCode: response.status, message: response.statusText };
    }
    throw error;
  }

  if (response.status === 202) {
    return undefined as T;
  }

  return response.json();
}
