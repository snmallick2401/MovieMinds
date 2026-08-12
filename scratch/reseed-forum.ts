import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function reseed() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log("No user found.");
    return;
  }

  // 1. Delete the rynamonroe thread
  const oldThread = await prisma.discussionThread.findFirst({
    where: { title: "rynamonroe" }
  });

  if (oldThread) {
    await prisma.discussionThread.delete({
      where: { id: oldThread.id }
    });
    console.log("Deleted old thread: rynamonroe");
  }

  // 2. Create Attack on Titan thread
  const thread = await prisma.discussionThread.create({
    data: {
      userId: user.id,
      title: "Attack on Titan - Final Season Discussion",
      body: "[img]https://m.media-amazon.com/images/M/MV5BNzc5MTczNDQtNDFjNi00ZDU5LThkOTItOTEzMGZlYTNlYzNlXkEyXkFqcGdeQXVyNTgyNTA4MjM@._V1_FMjpg_UX1000_.jpg[/img]\n\nWhat did everyone think of the final season? [b]No manga spoilers please![/b]",
      category: "GENERAL",
      replyCount: 2,
      viewCount: 420,
      reactionCount: 5,
      posts: {
        create: [
          {
            userId: user.id,
            body: "The animation by MAPPA was incredible! Especially during the rumbling scenes.",
            reactionCount: 3,
          },
          {
            userId: user.id,
            body: "[quote]The animation by MAPPA was incredible! Especially during the rumbling scenes.[/quote]\n\nTotally agree! The CGI titans looked much better than I expected.",
            reactionCount: 2,
          }
        ]
      }
    },
  });
  console.log("Created new Attack on Titan thread: " + thread.id);
}

reseed();
