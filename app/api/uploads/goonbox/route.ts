import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Mock Goonbox Upload API
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Simulate upload delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Generate a random ID
  const randomId = Math.random().toString(36).substring(2, 9);

  return NextResponse.json({
    imageId: randomId,
    pageUrl: `https://goonbox.cr/img/${randomId}`,
    imageUrl: `https://picsum.photos/seed/${randomId}/1080/1350`,
    thumbUrl: `https://picsum.photos/seed/${randomId}/400/500`,
    width: 1080,
    height: 1350
  });
}
