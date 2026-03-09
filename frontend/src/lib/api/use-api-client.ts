"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback } from "react";
import { apiClient } from "./client";

export function useApiClient() {
  const { getToken } = useAuth();

  const authenticatedFetch = useCallback(
    async <T>(path: string, options?: RequestInit): Promise<T> => {
      const token = await getToken();
      return apiClient<T>(path, { ...options, token: token ?? undefined });
    },
    [getToken]
  );

  return authenticatedFetch;
}
