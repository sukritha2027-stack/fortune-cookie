-- =========================================================
-- Fortune Cookie: base schema + Row Level Security
-- Records the tables, policies and sign-up trigger the app relies on.
-- Safe to run again (everything is "if not exists" / "or replace").
-- =========================================================

-- ---------- tables ----------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  name       text,
  plan       text not null default 'free',
  onboarded  boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.cookies (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  day        text not null,               -- local day key, e.g. 2026-11-15
  kind       text,
  fortune    text,
  answers    jsonb,
  created_at timestamptz not null default now()
);
create index if not exists cookies_user_id_idx on public.cookies (user_id);

create table if not exists public.journal (
  user_id    uuid not null references auth.users (id) on delete cascade,
  day        text not null,
  entries    jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, day)              -- the app upserts one row per user per day
);

-- Only two plans exist.
do $$ begin
  alter table public.profiles add constraint profiles_plan_check check (plan in ('free', 'plus'));
exception when duplicate_object then null; end $$;

-- ---------- Row Level Security: users see and edit only their own rows ----------
alter table public.profiles enable row level security;
alter table public.cookies  enable row level security;
alter table public.journal  enable row level security;

-- One policy per table, matching the live database.
drop policy if exists "profiles: own profile" on public.profiles;
create policy "profiles: own profile" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "cookies: own cookies" on public.cookies;
create policy "cookies: own cookies" on public.cookies for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "journal: own journal" on public.journal;
create policy "journal: own journal" on public.journal for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- create a profile row on sign-up ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name)
  values (new.id, new.raw_user_meta_data ->> 'name')
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
