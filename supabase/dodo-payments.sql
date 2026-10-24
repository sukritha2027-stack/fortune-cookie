-- =========================================================
-- Fortune Cookie: Dodo Payments setup
-- Run once in Supabase → SQL Editor → New query → Run.
-- Safe to run again.
-- =========================================================

-- 1. Columns the webhook fills in.
alter table public.profiles
  add column if not exists subscription_status  text,
  add column if not exists dodo_subscription_id text,
  add column if not exists dodo_customer_id     text,
  add column if not exists plan_updated_at      timestamptz;

create index if not exists profiles_dodo_subscription_id_idx
  on public.profiles (dodo_subscription_id);

-- 2. Lock the plan. Signed-in users may still edit their name and the
--    onboarding flag, but only the server (service-role key, used by
--    api/dodo-webhook.js) can change plan or subscription fields.
revoke update on public.profiles from anon, authenticated;
grant  update (name, onboarded) on public.profiles to authenticated;

revoke insert on public.profiles from anon, authenticated;
grant  insert (id, name) on public.profiles to authenticated;

-- 3. (Optional) Reset accounts that were upgraded by the old browser-side
--    flow and have no real subscription. Remove the leading "--" to run it.
-- update public.profiles set plan = 'free' where plan = 'plus' and dodo_subscription_id is null;
