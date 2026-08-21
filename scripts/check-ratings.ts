import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function check() {
  const over7 = await prisma.media.count({ where: { averageRating: { gt: 7 } } });
  const under7 = await prisma.media.count({ where: { averageRating: { lte: 7 } } });
  console.log(`Over 7: ${over7}`);
  console.log(`Under 7: ${under7}`);
}
check().finally(() => prisma.$disconnect());
