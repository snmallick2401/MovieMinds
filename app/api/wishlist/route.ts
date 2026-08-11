import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/server";
import { mediaForLibrary, serializeWishlistEntry } from "@/lib/library/serializers";
import { prisma } from "@/lib/prisma";
import { wishlistCreateSchema } from "@/lib/validations/library";
import { logActivity } from "@/lib/activity/tracking";

export async function GET() {
  try {
    const user = await requireUser();
    const items = await prisma.wishlist.findMany({
      where: { userId: user.id },
      include: { media: { include: mediaForLibrary } },
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ items: items.map(serializeWishlistEntry) });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

import { refreshMedia } from "@/lib/media/sync";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const parsed = wishlistCreateSchema.safeParse(await request.json());
    if (!parsed.success)
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message },
        { status: 400 },
      );
    let targetMediaId = parsed.data.mediaId;
    let media = await prisma.media.findUnique({
      where: { id: targetMediaId },
      select: { id: true },
    });
    if (
      !media &&
      (targetMediaId.startsWith("tmdb-") || targetMediaId.startsWith("anilist-"))
    ) {
      const source = targetMediaId.startsWith("tmdb-") ? "TMDB" : "ANILIST";
      const sourceId = targetMediaId.replace(/^(tmdb-|anilist-)/, "");
      const record = await refreshMedia(source, sourceId, "MOVIE");
      media = { id: record.id };
      targetMediaId = record.id;
    }
    if (!media) return NextResponse.json({ error: "Media not found." }, { status: 404 });
    const last = await prisma.wishlist.aggregate({
      where: { userId: user.id },
      _max: { position: true },
    });
    const item = await prisma.wishlist.upsert({
      where: { userId_mediaId: { userId: user.id, mediaId: media.id } },
      create: {
        userId: user.id,
        mediaId: media.id,
        priority: parsed.data.priority,
        note: parsed.data.note ?? null,
        position: (last._max.position ?? -1) + 1,
      },
      update: { priority: parsed.data.priority, note: parsed.data.note ?? null },
      include: { media: { include: mediaForLibrary } },
    });
    
    await logActivity({ userId: user.id, mediaId: targetMediaId, type: "WISHLISTED" });

    return NextResponse.json({ item: serializeWishlistEntry(item) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not update wishlist." }, { status: 500 });
  }
}
