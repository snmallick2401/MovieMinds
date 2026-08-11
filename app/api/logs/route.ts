import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    
    // Validate basic log structure
    if (!json || typeof json.message !== "string") {
      return NextResponse.json({ error: "Invalid log format" }, { status: 400 });
    }

    const { level = "info", message, context = {} } = json;
    
    // Add client-side flag
    const logData = { ...context, clientSide: true };

    switch (level) {
      case "error":
      case "fatal":
        logger.error(logData, message);
        break;
      case "warn":
        logger.warn(logData, message);
        break;
      case "debug":
        logger.debug(logData, message);
        break;
      default:
        logger.info(logData, message);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    // Fallback if the JSON parsing or logger throws
    console.error("Failed to process client log", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
