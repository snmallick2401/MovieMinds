export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
export const ALLOWED_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
]);

export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot === -1) return "";
  return filename.slice(lastDot).toLowerCase();
}

// Rate limit: max 20 uploads per minute per user/IP
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_UPLOADS_PER_WINDOW = 20;
const MAX_RATE_LIMIT_ENTRIES = 500;
export const uploadRateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function isUploadRateLimited(identifier: string): boolean {
  const now = Date.now();
  const entry = uploadRateLimitMap.get(identifier);

  if (!entry || now > entry.resetTime) {
    if (uploadRateLimitMap.size >= MAX_RATE_LIMIT_ENTRIES) {
      const oldest = uploadRateLimitMap.keys().next().value;
      if (oldest) uploadRateLimitMap.delete(oldest);
    }
    uploadRateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (entry.count >= MAX_UPLOADS_PER_WINDOW) {
    return true;
  }

  entry.count += 1;
  return false;
}

export function validateContentLength(contentLengthHeader: string | null): {
  valid: boolean;
  error?: string;
  status?: number;
} {
  if (!contentLengthHeader) return { valid: true };
  const contentLength = parseInt(contentLengthHeader, 10);
  // Allow minor multipart headers/boundary overhead (+32KB) over MAX_FILE_SIZE
  if (isNaN(contentLength) || contentLength > MAX_FILE_SIZE + 32 * 1024) {
    return {
      valid: false,
      error: "Payload exceeds maximum allowed size of 5MB.",
      status: 413,
    };
  }
  return { valid: true };
}

export function validateUploadFile(file: unknown): {
  valid: boolean;
  error?: string;
  status?: number;
  file?: File;
} {
  if (!file || !(file instanceof File)) {
    return { valid: false, error: "No file provided", status: 400 };
  }

  // Enforce strict file size limit
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: "File size exceeds 5MB limit.", status: 413 };
  }

  // Enforce strict MIME type whitelist
  if (!ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
    return {
      valid: false,
      error: "Unsupported file type. Only JPEG, PNG, WEBP, and GIF images are allowed.",
      status: 415,
    };
  }

  // Enforce extension whitelist if filename is provided
  if (file.name) {
    const ext = getFileExtension(file.name);
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return {
        valid: false,
        error: "Unsupported file extension. Only .jpg, .jpeg, .png, .webp, and .gif are allowed.",
        status: 415,
      };
    }
  }

  return { valid: true, file };
}
