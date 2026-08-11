import { refreshMedia } from "../lib/media/sync";
import { prisma } from "../lib/prisma";

async function run() {
  const media = await prisma.media.findFirst({
    where: { title: "Spider-Man: No Way Home" },
  });
  if (media) {
    console.log("Refreshing", media.title);
    await refreshMedia(media.source, media.sourceId, media.mediaType as any);
    console.log("Done");
  }
}
run();
