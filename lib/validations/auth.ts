import { z } from "zod";
import { usernameSchema } from "@/lib/validations/profile";

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export const signupSchema = z
  .object({
    email: z.string().trim().email("Enter a valid email address."),
    username: usernameSchema,
    displayName: z.string().trim().min(1, "Display name is required.").max(80),
    password: z.string().min(8, "Use at least 8 characters."),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;

/**
 * Validates that a redirect path is a safe internal relative path,
 * preventing Open Redirect vulnerabilities (protocol-relative URLs //evil.com,
 * backslash tricks /\evil.com, or encoded equivalents /%2fevil.com).
 */
export function getSafeRedirectUrl(target: string | null | undefined, fallback = "/"): string {
  if (!target || typeof target !== "string") return fallback;
  const trimmed = target.trim();

  // Must start with '/' but never with '//' or '/\' or contain backslashes
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes("\\")) {
    return fallback;
  }

  // Reject CRLF or control characters
  if (/[\x00-\x1F\x7F]/.test(trimmed)) {
    return fallback;
  }

  // Guard against URL-encoded bypasses (e.g. /%2f or /%5c)
  try {
    const decoded = decodeURIComponent(trimmed);
    if (!decoded.startsWith("/") || decoded.startsWith("//") || decoded.includes("\\")) {
      return fallback;
    }
  } catch {
    return fallback;
  }

  return trimmed;
}
