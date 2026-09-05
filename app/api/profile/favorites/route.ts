import { NextResponse } from "next/server";
import { requireUser, isUnauthorized } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { refreshMedia } from "@/lib/media/sync";
import { MediaType } from "@prisma/client";

const favoritesSchema = z.object({
  category: z.enum(["MOVIE", "TV", "ANIME"]),
  mediaIds: z.array(z.string()).max(4),
});

export async function PUT(request: Request) {
  try {
    const user = await requireUser();
    const json = await request.json();
    const parsed = favoritesSchema.safeParse(json);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message },
        { status: 400 },
      );
    }
    
    const { category, mediaIds } = parsed.data;
    
    // Resolve media IDs, syncing from external sources if needed
    const resolvedMediaIds: string[] = [];
    for (const targetMediaId of mediaIds) {
      let media = await prisma.media.findUnique({
        where: { id: targetMediaId },
        select: { id: true },
      });
      
      if (!media && (targetMediaId.startsWith("tmdb-") || targetMediaId.startsWith("anilist-"))) {
        const source = targetMediaId.startsWith("tmdb-") ? "TMDB" : "ANILIST";
        const sourceId = targetMediaId.replace(/^(tmdb-|anilist-)/, "");
        const record = await refreshMedia(source, sourceId, category === "ANIME" ? "ANIME" : category);
        media = { id: record.id };
      }
      
      if (media) {
        resolvedMediaIds.push(media.id);
      }
    }
    
    // Transaction to replace favorites for this category
    await prisma.$transaction(async (tx) => {
      await tx.userFavorite.deleteMany({
        where: { userId: user.id, category: category as MediaType },
      });
      
      if (resolvedMediaIds.length > 0) {
        await tx.userFavorite.createMany({
          data: resolvedMediaIds.map((mediaId, index) => ({
            userId: user.id,
            mediaId,
            category: category as MediaType,
            position: index,
          })),
        });
      }
    });
    
    return NextResponse.json({ success: true, mediaIds: resolvedMediaIds });
  } catch (error: unknown) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Favorites sync error:", error);
    return NextResponse.json({ error: "Could not update favorites." }, { status: 500 });
  }
}
