-- Run this in Supabase SQL Editor before enabling sign-ups.
-- It creates public profiles atomically whenever Supabase Auth creates a user.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  username varchar(30) not null unique,
  "displayName" varchar(80) not null,
  "avatarUrl" text,
  bio varchar(500),
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  constraint username_format check (username ~ '^[a-z0-9_]{3,30}$')
);

alter table public.profiles enable row level security;

create policy "Profiles are publicly readable" on public.profiles
  for select using (true);
create policy "Users update their own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

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
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new."updatedAt" = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();
