"use client";

import { useState, useCallback } from "react";
import { useRequestMapBackgroundUpload } from "./use-request-map-background-upload";
import { useSetMapBackground } from "./use-set-map-background";

export type UploadStatus = "idle" | "uploading" | "confirming" | "done" | "error";

export function useUploadMapBackground(
  campaignId: string,
  mapLevelId: string
) {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const requestUpload = useRequestMapBackgroundUpload(campaignId, mapLevelId);
  const setBackground = useSetMapBackground(campaignId, mapLevelId);

  const upload = useCallback(
    async (file: File) => {
      setStatus("uploading");
      setError(null);

      try {
        // Step 1: Request presigned URL
        const { uploadUrl, publicUrl } =
          await requestUpload.mutateAsync({
            contentType: file.type,
            fileSizeBytes: file.size,
          });

        // Step 2: Upload file directly to S3/R2
        const uploadResponse = await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload file to storage");
        }

        // Step 3: Confirm background set
        setStatus("confirming");
        await setBackground.mutateAsync({
          backgroundImageUrl: publicUrl,
        });

        setStatus("done");
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Upload failed");
        throw err;
      }
    },
    [requestUpload, setBackground]
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
  }, []);

  return {
    upload,
    status,
    error,
    reset,
    isUploading: status === "uploading" || status === "confirming",
  };
}
