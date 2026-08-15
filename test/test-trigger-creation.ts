import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const prisma = new PrismaClient();

async function testTriggerCreation() {
  const random = Math.floor(Math.random() * 100000);
  const testEmail = `autotest_${random}@lanvos.com`;
  const testPassword = "Password123!";
  const testUsername = `user_trig_${random}`;
  const testDisplayName = `Trigger User ${random}`;

  console.log(`Creating new user ${testEmail}...`);
  const { data, error } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: {
        username: testUsername,
        display_name: testDisplayName,
      },
    },
  });

  if (error) {
    console.error("SignUp error:", error.message);
    return;
  }

  const userId = data.user?.id;
  console.log(`User created in Supabase Auth. ID: ${userId}`);

  // Wait 1 second for Postgres trigger to execute
  await new Promise((r) => setTimeout(r, 1500));

  const profile = await prisma.user.findUnique({
    where: { id: userId },
  });

  console.log("Trigger created profile in DB:", profile);

  if (profile && profile.username === testUsername) {
    console.log("SUCCESS: Trigger automatically created user profile on sign up!");
  } else {
    console.error("FAILURE: Profile was not created by trigger!");
  }

  await prisma.$disconnect();
}

testTriggerCreation();
