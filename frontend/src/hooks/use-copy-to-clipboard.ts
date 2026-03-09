"use client";

import { useState, useCallback, useRef } from "react";

export function useCopyToClipboard() {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setError(null);

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to copy to clipboard")
      );
      setCopied(false);
    }
  }, []);

  return { copy, copied, error };
}
