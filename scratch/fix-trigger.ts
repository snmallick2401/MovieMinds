import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
const prisma = new PrismaClient();

async function fixTrigger() {
  try {
    console.log("Updating handle_new_user function with robust fallback and error handling...");
    await prisma.$executeRawUnsafe(`
      create or replace function public.handle_new_user()
      returns trigger
      language plpgsql
      security definer set search_path = public
      as $$
      declare
        clean_username varchar(30);
        clean_display_name varchar(80);
      begin
        clean_username := lower(regexp_replace(coalesce(new.raw_user_meta_data ->> 'username', 'user_' || substring(new.id::text, 1, 8)), '[^a-z0-9_]', '_', 'g'));
        if length(clean_username) < 3 then
          clean_username := 'user_' || substring(new.id::text, 1, 8);
        end if;
        clean_username := substring(clean_username, 1, 30);

        clean_display_name := substring(coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)), 1, 80);

        insert into public.profiles (id, email, username, "displayName", "createdAt", "updatedAt")
        values (
          new.id,
          new.email,
          clean_username,
          clean_display_name,
          now(),
          now()
        )
        on conflict (id) do nothing;
        return new;
      exception when others then
        return new;
      end;
      $$;
    `);

    console.log("Trigger function handle_new_user updated successfully!");
  } catch (err) {
    console.error("Fix trigger error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

fixTrigger();
