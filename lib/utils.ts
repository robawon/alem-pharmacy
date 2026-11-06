import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formats a Date/ISO string as a short relative time, e.g. "2m ago". Falls back to locale time for older events. */
export function relativeTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.round(diffMs / 1000);
  if (diffSec < 5) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return date.toLocaleString();
}

export function newId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function currency(amount: number): string {
  return `${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB`;
}

/**
 * Formats a Date/ISO string in the application's standard timezone (Africa/Addis_Ababa)
 * using a 12-hour format with AM/PM: e.g. "Nov 6, 2026, 5:59 PM".
 */
export function formatAddisDateTime(dateInput: string | number | Date): string {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return "N/A";
  return d.toLocaleString("en-US", {
    timeZone: "Africa/Addis_Ababa",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

