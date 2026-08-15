import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
const prisma = new PrismaClient();

async function check() {
  try {
    console.log("Checking database connection and profiles...");
    const profilesCount = await prisma.user.count();
    console.log("Total profiles in DB:", profilesCount);

    const allProfiles = await prisma.user.findMany({ take: 10 });
    console.log("Sample profiles:", JSON.stringify(allProfiles, null, 2));

    // Check if user 04eff6a0-e306-4340-ba92-2272da6178e8 exists in DB
    const userProfile = await prisma.user.findUnique({
      where: { id: "04eff6a0-e306-4340-ba92-2272da6178e8" },
    });
    console.log("Profile for test user 04eff6a0-e306-4340-ba92-2272da6178e8:", userProfile);
  } catch (err) {
    console.error("DB check error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

check();
