/**
 * Security utilities for Class 1 (Critical Credentials & Keys) protection.
 * Sanitizes and protects database connection strings, auth tokens, secrets,
 * and session keys from accidental logging or exposure.
 */

const DATABASE_URL_REGEX = /(postgres(?:ql)?:\/\/[^:]+:)([^@]+)(@)/gi;
const BEARER_TOKEN_REGEX = /(Bearer\s+)[A-Za-z0-9\-_.]+/gi;
const JWT_TOKEN_REGEX = /\beyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\b/g;
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

/**
 * Sanitizes strings, objects, or errors by removing sensitive database passwords,
 * JWT tokens, secret strings, and PII (email addresses).
 */
export function scrubSensitiveData(data: unknown): unknown {
  if (typeof data === "string") {
    let sanitized = data
      .replace(DATABASE_URL_REGEX, "$1[REDACTED]$3")
      .replace(BEARER_TOKEN_REGEX, "$1[REDACTED]")
      .replace(JWT_TOKEN_REGEX, "[REDACTED_JWT]")
      .replace(EMAIL_REGEX, "[REDACTED_EMAIL]");

    const syncSecret = process.env.CATALOG_SYNC_SECRET;
    if (syncSecret && syncSecret.length > 5) {
      sanitized = sanitized.replaceAll(syncSecret, "[REDACTED_SECRET]");
    }

    return sanitized;
  }

  if (data instanceof Error) {
    const cleanError = new Error(scrubSensitiveData(data.message) as string);
    cleanError.name = data.name;
    if (data.stack) {
      cleanError.stack = scrubSensitiveData(data.stack) as string;
    }
    return cleanError;
  }

  if (Array.isArray(data)) {
    return data.map(scrubSensitiveData);
  }

  if (data !== null && typeof data === "object") {
    const SENSITIVE_KEYS = new Set([
      "password",
      "token",
      "accesstoken",
      "refreshtoken",
      "access_token",
      "refresh_token",
      "secret",
      "authorization",
      "cookie",
      "email",
      "emailaddress",
      "email_address",
      "user_email",
      "database_url",
      "direct_url",
      "catalog_sync_secret",
      "supabase_service_role_key",
      "params",
      "apikey",
      "api_key",
      "session",
      "sessiontoken",
      "session_token",
      "hash",
    ]);

    const sanitizedObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        sanitizedObj[key] = "[REDACTED]";
      } else {
        sanitizedObj[key] = scrubSensitiveData(value);
      }
    }
    return sanitizedObj;
  }

  return data;
}

/**
 * Validates the operational configuration and entropy of Class 1 credentials.
 */
export function validateClass1Credentials(): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || !dbUrl.startsWith("postgres")) {
    issues.push("DATABASE_URL is missing or does not start with postgres protocol");
  }

  const syncSecret = process.env.CATALOG_SYNC_SECRET;
  if (!syncSecret || syncSecret.trim().length < 32) {
    issues.push("CATALOG_SYNC_SECRET is missing or has insufficient length (min 32 chars required)");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || !supabaseUrl.startsWith("https://")) {
    issues.push("NEXT_PUBLIC_SUPABASE_URL is missing or not a secure HTTPS URL");
  }

  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey || !anonKey.startsWith("eyJ")) {
    issues.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or not a valid JWT format");
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
