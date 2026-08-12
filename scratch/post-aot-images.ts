import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function post() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log("No user found.");
    return;
  }

  const thread = await prisma.discussionThread.findFirst({
    where: { title: { contains: "Attack on Titan" } }
  });

  if (!thread) {
    console.log("Thread not found.");
    return;
  }

  const body = `Here are some awesome frames from the season!

[img]/uploads/static-assets-upload13070996763325226186.webp[/img]

[img]/uploads/static-assets-upload15858752676625283549.webp[/img]`;

  const newPost = await prisma.discussionPost.create({
    data: {
      threadId: thread.id,
      userId: user.id,
      body: body,
    }
  });

  await prisma.discussionThread.update({
    where: { id: thread.id },
    data: { replyCount: { increment: 1 } }
  });

  console.log("Posted images to thread: " + newPost.id);
}

post();
