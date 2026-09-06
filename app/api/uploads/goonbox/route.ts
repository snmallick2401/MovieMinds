import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import crypto from "crypto";
import {
  MAX_FILE_SIZE,
  validateContentLength,
  validateUploadFile,
  isUploadRateLimited,
} from "@/lib/validations/uploads";

export const dynamic = "force-dynamic";

// Mock Goonbox Upload API (Hardened against DoS & Unbounded Uploads)
export async function POST(request: NextRequest) {
  try {
    // Pre-stream payload size check: prevent buffering oversized request bodies
    const lengthCheck = validateContentLength(request.headers.get("content-length"));
    if (!lengthCheck.valid) {
      logger.warn({
        msg: "Upload blocked by Content-Length header check",
        contentLength: request.headers.get("content-length"),
        maxAllowed: MAX_FILE_SIZE,
      });
      return NextResponse.json(
        { error: lengthCheck.error },
        { status: lengthCheck.status },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Enforce rate limiting per user
    if (isUploadRateLimited(user.id)) {
      logger.warn({ msg: "Upload rate limit exceeded", userId: user.id });
      return NextResponse.json(
        { error: "Upload rate limit exceeded. Please wait a minute." },
        { status: 429 },
      );
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (parseError) {
      logger.warn({ msg: "Failed to parse upload formData", error: parseError, userId: user.id });
      return NextResponse.json({ error: "Invalid multipart form data." }, { status: 400 });
    }

    const file = formData.get("file");
    const fileCheck = validateUploadFile(file);
    if (!fileCheck.valid) {
      logger.warn({
        msg: "Upload file rejected",
        error: fileCheck.error,
        userId: user.id,
      });
      return NextResponse.json(
        { error: fileCheck.error },
        { status: fileCheck.status },
      );
    }

    // Secure random identifier generation (cryptographically strong)
    const randomId = crypto.randomBytes(4).toString("hex");

    return NextResponse.json(
      {
        imageId: randomId,
        pageUrl: `https://goonbox.cr/img/${randomId}`,
        imageUrl: `https://picsum.photos/seed/${randomId}/1080/1350`,
        thumbUrl: `https://picsum.photos/seed/${randomId}/400/500`,
        width: 1080,
        height: 1350,
      },
      {
        headers: {
          "Cache-Control": "private, no-store, must-revalidate",
        },
      },
    );
  } catch (error) {
    logger.error({ msg: "Upload processing error", error });
    return NextResponse.json({ error: "Internal server error during upload." }, { status: 500 });
  }
}
