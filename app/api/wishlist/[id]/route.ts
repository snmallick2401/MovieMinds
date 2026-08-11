import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/server";
import { mediaForLibrary, serializeWishlistEntry } from "@/lib/library/serializers";
import { prisma } from "@/lib/prisma";
import { wishlistUpdateSchema } from "@/lib/validations/library";
import { removeActivity } from "@/lib/activity/tracking";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const [user, { id }] = await Promise.all([requireUser(), params]);
    const parsed = wishlistUpdateSchema.safeParse(await request.json());
    if (!parsed.success)
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message },
        { status: 400 },
      );
    const item = await prisma.wishlist.updateMany({
      where: { id, userId: user.id },
      data: parsed.data,
    });
    if (!item.count)
      return NextResponse.json({ error: "Wishlist item not found." }, { status: 404 });
    const updated = await prisma.wishlist.findUniqueOrThrow({
      where: { id },
      include: { media: { include: mediaForLibrary } },
    });
    return NextResponse.json({ item: serializeWishlistEntry(updated) });
  } catch {
    return NextResponse.json(
      { error: "Could not update wishlist item." },
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
    const wishlist = await prisma.wishlist.findFirst({ where: { id, userId: user.id } });
    if (!wishlist) return NextResponse.json({ error: "Item not found." }, { status: 404 });
    await prisma.wishlist.delete({ where: { id } });

    await removeActivity(user.id, wishlist.mediaId, "WISHLISTED");

    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json(
      { error: "Could not remove from wishlist." },
      { status: 500 },
    );
  }
}
