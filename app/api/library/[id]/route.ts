import { NextResponse } from "next/server";
import { requireUser, isUnauthorized } from "@/lib/auth/server";
import { completedLibraryData } from "@/lib/library/helpers";
import { mediaForLibrary, serializeLibraryEntry } from "@/lib/library/serializers";
import { prisma } from "@/lib/prisma";
import { libraryUpdateSchema } from "@/lib/validations/library";
import { logActivity, removeActivity } from "@/lib/activity/tracking";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const [user, { id }] = await Promise.all([requireUser(), params]);
    const parsed = libraryUpdateSchema.safeParse(await request.json());
    if (!parsed.success)
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message },
        { status: 400 },
      );
    const current = await prisma.userLibrary.findFirst({
      where: { id, userId: user.id },
      include: { media: { select: { episodeCount: true } } },
    });
    if (!current)
      return NextResponse.json({ error: "Library entry not found." }, { status: 404 });
    const progress = parsed.data.progress ?? current.progress;
    const requestedStatus = parsed.data.status ?? current.status;
    const state = completedLibraryData(
      requestedStatus,
      progress,
      current.media.episodeCount,
    );
    const entry = await prisma.userLibrary.update({
      where: { id },
      data: {
        progress,
        favorite: parsed.data.favorite ?? current.favorite,
        startedAt: current.startedAt ?? (state.status === "WATCHING" ? new Date() : null),
        ...state,
        watchCount: state.completed && !current.completed ? { increment: 1 } : undefined,
      },
      include: { media: { include: mediaForLibrary } },
    });
    if (state.completed && !current.completed)
      await prisma.watchHistory.create({
        data: {
          userId: user.id,
          mediaId: current.mediaId,
          progress,
          watchedAt: parsed.data.watchedAt ? new Date(parsed.data.watchedAt) : new Date(),
        },
      });

    if (state.completed && !current.completed) {
      await logActivity({ userId: user.id, mediaId: current.mediaId, type: "COMPLETED" });
    } else if (state.status === "WATCHING" && current.status !== "WATCHING") {
      await logActivity({ userId: user.id, mediaId: current.mediaId, type: "STARTED" });
    }

    return NextResponse.json({ item: serializeLibraryEntry(entry) });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Could not update library entry." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const [user, { id }] = await Promise.all([requireUser(), params]);
    const current = await prisma.userLibrary.findFirst({ where: { id, userId: user.id } });
    if (!current) return NextResponse.json({ error: "Library entry not found." }, { status: 404 });
    await prisma.userLibrary.delete({ where: { id } });

    await removeActivity(user.id, current.mediaId, "COMPLETED");
    await removeActivity(user.id, current.mediaId, "STARTED");

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Could not remove library entry." },
      { status: 500 },
    );
  }
}
