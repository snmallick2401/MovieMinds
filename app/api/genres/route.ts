import { NextResponse } from "next/server";
import { getGenres } from "@/lib/media/queries";

export async function GET() {
  return NextResponse.json({ genres: await getGenres() });
}
