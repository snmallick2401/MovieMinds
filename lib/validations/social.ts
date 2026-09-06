export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Rate limiting: max 30 follow/unfollow operations per minute per user
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_FOLLOW_OPS_PER_WINDOW = 30;
const MAX_RATE_LIMIT_ENTRIES = 500;
export const followRateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function isFollowRateLimited(identifier: string): boolean {
  const now = Date.now();
  const entry = followRateLimitMap.get(identifier);

  if (!entry || now > entry.resetTime) {
    if (followRateLimitMap.size >= MAX_RATE_LIMIT_ENTRIES) {
      const oldest = followRateLimitMap.keys().next().value;
      if (oldest) followRateLimitMap.delete(oldest);
    }
    followRateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (entry.count >= MAX_FOLLOW_OPS_PER_WINDOW) {
    return true;
  }

  entry.count += 1;
  return false;
}

export function validateFollowTarget(
  targetUserId: unknown,
  currentUserId: string,
): { valid: false; error: string; status: number } | { valid: true; targetUserId: string } {
  if (!targetUserId || typeof targetUserId !== "string" || !UUID_REGEX.test(targetUserId)) {
    return { valid: false, error: "Invalid or missing targetUserId", status: 400 };
  }
  if (currentUserId === targetUserId) {
    return { valid: false, error: "Cannot follow yourself", status: 400 };
  }
  return { valid: true, targetUserId };
}
