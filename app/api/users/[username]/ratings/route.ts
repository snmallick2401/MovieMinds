import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params; const page = Math.max(1, Number(request.nextUrl.searchParams.get("page")) || 1); const pageSize = 20;
  const profile = await prisma.user.findUnique({ where: { username }, select: { id: true, libraryPublic: true } });
  if (!profile || !profile.libraryPublic) return NextResponse.json({ error: "Ratings are not public." }, { status: 404 });
  const [items, total] = await prisma.$transaction([
    prisma.userRating.findMany({ where: { userId: profile.id }, include: { media: { select: { id: true, title: true, posterUrl: true, year: true, mediaType: true, communityAverageRating: true } } }, orderBy: { updatedAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.userRating.count({ where: { userId: profile.id } }),
  ]);
  return NextResponse.json({ items: items.map((item) => ({ ...item, rating: Number(item.rating), createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString(), media: { ...item.media, communityAverageRating: item.media.communityAverageRating ? Number(item.media.communityAverageRating) : null } })), page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
}
