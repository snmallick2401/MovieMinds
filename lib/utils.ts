import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatJoinDate(date: Date) {
  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(date);
}

export function initials(name?: string) {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function formatLanguageName(code: string | null | undefined): string | null {
  if (!code) return null;
  const clean = code.trim();
  if (!clean || clean.toLowerCase() === "not available") return null;
  try {
    const displayNames = new Intl.DisplayNames(["en"], { type: "language" });
    return displayNames.of(clean.toLowerCase()) || clean;
  } catch {
    return clean;
  }
}

export function formatCountryName(code: string | null | undefined): string | null {
  if (!code) return null;
  const clean = code.trim();
  if (!clean || clean.toLowerCase() === "not available") return null;
  try {
    const displayNames = new Intl.DisplayNames(["en"], { type: "region" });
    return displayNames.of(clean.toUpperCase()) || clean;
  } catch {
    return clean;
  }
}
