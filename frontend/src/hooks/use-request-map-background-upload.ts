"use client";

import { useMutation } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/use-api-client";
import type { MapBackgroundUploadResponse } from "@/types/api";

interface RequestUploadInput {
  contentType: string;
  fileSizeBytes: number;
}

export function useRequestMapBackgroundUpload(
  campaignId: string,
  mapLevelId: string
) {
  const apiFetch = useApiClient();

  return useMutation({
    mutationFn: async (
      input: RequestUploadInput
    ): Promise<MapBackgroundUploadResponse> => {
      const response = await apiFetch<{
        data: MapBackgroundUploadResponse;
      }>(
        `/api/campaigns/${campaignId}/map-levels/${mapLevelId}/background/upload-url`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contentType: input.contentType,
            fileSizeBytes: input.fileSizeBytes,
            commandId: crypto.randomUUID(),
          }),
        }
      );
      return response.data;
    },
  });
}
