const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const media = await prisma.media.findFirst();
  console.log("MEDIA_ID=" + (media ? media.id : 'NONE'));
  const user = await prisma.user.findFirst({ where: { email: "snmallick2401@gmail.com" } });
  console.log("USER_ID=" + (user ? user.id : 'NONE'));
}
main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
