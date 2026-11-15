-- =========================================================
-- Fortune Cookie: owner / tester accounts live in the database
-- Replaces the PLUS_EMAILS list that used to sit in config.js.
-- Safe to run again.
-- =========================================================

-- 1. Owner flag. Owners see Plus and get the "Preview as Free" toggle.
alter table public.profiles
  add column if not exists is_owner boolean not null default false;

-- 2. Make sure signed-in users still can't change plan, subscription
--    fields or is_owner. They may only edit their name and onboarding flag.
revoke update on public.profiles from anon, authenticated;
grant  update (name, onboarded) on public.profiles to authenticated;
revoke update (plan) on public.profiles from authenticated;

-- 3. Mark an account as owner. Run this in the SQL editor with the real
--    email. Don't commit real email addresses to this repo.
--
-- update public.profiles p
--    set is_owner = true, plan = 'plus'
--   from auth.users u
--  where u.id = p.id and lower(u.email) = lower('YOUR_EMAIL_HERE');
