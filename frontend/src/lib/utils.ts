import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNow } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeDate(dateString: string): string | null {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return null;
  }
}
