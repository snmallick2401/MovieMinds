import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
const prisma = new PrismaClient();

async function setup() {
  try {
    console.log("Installing handle_new_user function...");
    await prisma.$executeRawUnsafe(`
      create or replace function public.handle_new_user()
      returns trigger
      language plpgsql
      security definer set search_path = public
      as $$
      begin
        insert into public.profiles (id, email, username, "displayName")
        values (
          new.id,
          new.email,
          coalesce(new.raw_user_meta_data ->> 'username', 'user_' || substring(new.id::text, 1, 8)),
          coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
        )
        on conflict (id) do nothing;
        return new;
      end;
      $$;
    `);

    console.log("Dropping existing trigger if any...");
    await prisma.$executeRawUnsafe(`
      drop trigger if exists on_auth_user_created on auth.users;
    `);

    console.log("Creating trigger on_auth_user_created...");
    await prisma.$executeRawUnsafe(`
      create trigger on_auth_user_created
        after insert on auth.users
        for each row execute procedure public.handle_new_user();
    `);
    console.log("Trigger on_auth_user_created successfully installed!");

    console.log("Confirming email for roloy63370@lanvos.com...");
    await prisma.$executeRawUnsafe(`
      UPDATE auth.users 
      SET email_confirmed_at = NOW() 
      WHERE email = 'roloy63370@lanvos.com';
    `);
    console.log("Email confirmed!");

    const testUser = await prisma.user.findFirst({
      where: { email: "roloy63370@lanvos.com" },
    });

    if (!testUser) {
      const authUserRows: any[] = await prisma.$queryRaw`
        SELECT id, email, raw_user_meta_data FROM auth.users WHERE email = 'roloy63370@lanvos.com';
      `;
      if (authUserRows.length > 0) {
        const u = authUserRows[0];
        const meta = u.raw_user_meta_data || {};
        const username = meta.username || "roloy63370";
        const displayName = meta.display_name || "Roloy User";
        await prisma.user.create({
          data: {
            id: u.id,
            email: u.email,
            username,
            displayName,
          },
        });
        console.log("Profile manually populated for existing test user!");
      }
    } else {
      console.log("Profile already exists:", testUser);
    }
  } catch (err) {
    console.error("Setup error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

setup();
