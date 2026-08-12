import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
const prisma = new PrismaClient();

async function checkTrigger() {
  try {
    const triggers = await prisma.$queryRaw`
      SELECT trigger_name, event_manipulation, event_object_table
      FROM information_schema.triggers
      WHERE trigger_name = 'on_auth_user_created';
    `;
    console.log("Triggers found:", triggers);

    // Also check raw_user_meta_data for user 04eff6a0-e306-4340-ba92-2272da6178e8 in auth.users if accessible
    const authUsers = await prisma.$queryRaw`
      SELECT id, email, email_confirmed_at, raw_user_meta_data 
      FROM auth.users 
      WHERE email = 'roloy63370@lanvos.com';
    `;
    console.log("Auth user row:", authUsers);
  } catch (err) {
    console.error("Error querying triggers or auth.users:", err);
  } finally {
    await prisma.$disconnect();
  }
}

checkTrigger();
