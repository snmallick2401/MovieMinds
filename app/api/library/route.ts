import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/server";
import { completedLibraryData } from "@/lib/library/helpers";
import { mediaForLibrary, serializeLibraryEntry } from "@/lib/library/serializers";
import { prisma } from "@/lib/prisma";
import { libraryCreateSchema } from "@/lib/validations/library";
import { libraryStatuses, type LibraryStatus } from "@/types/library";
import { logActivity } from "@/lib/activity/tracking";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const rawStatus = request.nextUrl.searchParams.get("status");
    const status = libraryStatuses.includes(rawStatus as LibraryStatus)
      ? (rawStatus as LibraryStatus)
      : undefined;
    const query = request.nextUrl.searchParams.get("q")?.trim();
    const entries = await prisma.userLibrary.findMany({
      where: {
        userId: user.id,
        ...(status ? { status } : {}),
        ...(query ? { media: { title: { contains: query, mode: "insensitive" } } } : {}),
      },
      include: { media: { include: mediaForLibrary } },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ items: entries.map(serializeLibraryEntry) });
  } catch (error) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 500 },
    );
  }
}

import { refreshMedia } from "@/lib/media/sync";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const parsed = libraryCreateSchema.safeParse(await request.json());
    if (!parsed.success)
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message },
        { status: 400 },
      );
    let targetMediaId = parsed.data.mediaId;
    let media = await prisma.media.findUnique({
      where: { id: targetMediaId },
      select: { id: true, episodeCount: true },
    });
    if (
      !media &&
      (targetMediaId.startsWith("tmdb-") || targetMediaId.startsWith("anilist-"))
    ) {
      const source = targetMediaId.startsWith("tmdb-") ? "TMDB" : "ANILIST";
      const sourceId = targetMediaId.replace(/^(tmdb-|anilist-)/, "");
      const record = await refreshMedia(source, sourceId, "MOVIE");
      media = { id: record.id, episodeCount: record.episodeCount };
      targetMediaId = record.id;
    }
    if (!media) return NextResponse.json({ error: "Media not found." }, { status: 404 });
    const progress = parsed.data.progress ?? 0;
    const state = completedLibraryData(parsed.data.status, progress, media.episodeCount);
    const entry = await prisma.userLibrary.upsert({
      where: { userId_mediaId: { userId: user.id, mediaId: targetMediaId } },
      create: {
        userId: user.id,
        mediaId: targetMediaId,
        progress,
        favorite: parsed.data.favorite ?? false,
        startedAt: state.status === "WATCHING" ? new Date() : null,
        ...state,
        watchCount: state.completed ? 1 : 0,
      },
      update: { progress, favorite: parsed.data.favorite ?? undefined, ...state },
      include: { media: { include: mediaForLibrary } },
    });

    if (state.completed) {
      await logActivity({ userId: user.id, mediaId: targetMediaId, type: "COMPLETED" });
    } else if (state.status === "WATCHING") {
      await logActivity({ userId: user.id, mediaId: targetMediaId, type: "STARTED" });
    }

    return NextResponse.json({ item: serializeLibraryEntry(entry) }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error && error.message === "UNAUTHORIZED"
            ? "Unauthorized"
            : "Could not update your library.",
      },
      { status: error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 500 },
    );
  }
}
