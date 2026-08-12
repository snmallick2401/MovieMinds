import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function seed() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log("No user found.");
    return;
  }

  // Set user's reputation high to show the Simp Council badge
  await prisma.user.update({
    where: { id: user.id },
    data: { reputationScore: 341 },
  });

  const thread = await prisma.discussionThread.create({
    data: {
      userId: user.id,
      title: "rynamonroe",
      body: "[img]https://simp6.cuckcapital.cr/images4/0d58685b-06b2-499b-ae68-8ca9c5fbc9a6.jpg[/img]\n[img]https://simp6.cuckcapital.cr/images4/ea830251-6bbf-4736-a2c0-64021c076bab.jpg[/img]",
      category: "GENERAL",
      replyCount: 3,
      viewCount: 1530,
      reactionCount: 13,
      posts: {
        create: [
          {
            userId: user.id,
            body: "Bruh she has to sell 🏄‍♂️\n\n[quote]bruh she has to sell 🏄‍♂️[/quote]",
            reactionCount: 5,
          },
          {
            userId: user.id,
            body: "[img]https://simp6.cuckcapital.cr/images4/28ffafcd-017e-479b-aeb1-f64f911485da.jpg[/img]\nDon't think these are on here from snap highlights",
            reactionCount: 3,
          }
        ]
      }
    },
  });
  console.log("Thread created: " + thread.id);
}

seed();
