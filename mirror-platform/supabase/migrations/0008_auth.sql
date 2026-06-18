-- ============================================================================
-- The Mirror Platform — 0008 auth provisioning (P9 / Batch 5, Stripe-independent)
-- On signup, provision the PERSON rows (app_user + a chosen handle + a free
-- subscription) so the corpus attribution hinge (Permanence §0) exists from the
-- first session. An architect allowlist links the designated account to the
-- a-reflection handle with full access — the highest-trust role, gated by email.
-- ============================================================================

-- the architect allowlist (who may hold the a-reflection / is_architect handle)
create table if not exists architect_allow (
  email text primary key
);
alter table architect_allow enable row level security;  -- no policies: deny all clients
insert into architect_allow(email) values ('ilyadbauer@gmail.com') on conflict do nothing;

-- current_tier must treat the architect as full-access (patron rank) regardless
-- of any subscription row (the console is not a purchase).
create or replace function current_tier() returns tier
language sql stable security definer set search_path = public as $$
  select case
    when is_architect() then 'patron'::tier
    else coalesce(
      (select tier from subscription
        where user_id = auth.uid() and status in ('active','trialing') limit 1), 'free')::tier
  end;
$$;

-- provision PERSON rows on auth signup.
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public, auth as $$
declare v_handle text; v_arch boolean;
begin
  v_arch := exists (select 1 from architect_allow where lower(email) = lower(new.email));
  if v_arch then
    insert into app_user (id, email, handle) values (new.id, new.email, 'a-reflection')
      on conflict (id) do update set email = excluded.email, handle = 'a-reflection';
    insert into subscription (user_id, tier, status) values (new.id, 'patron', 'active')
      on conflict (user_id) do update set tier = 'patron', status = 'active';
  else
    v_handle := 'u-' || substr(replace(new.id::text, '-', ''), 1, 8);
    insert into handle (handle, display, is_architect)
      values (v_handle, coalesce(split_part(new.email, '@', 1), 'reader'), false)
      on conflict (handle) do nothing;
    insert into app_user (id, email, handle) values (new.id, new.email, v_handle)
      on conflict (id) do update set email = excluded.email;
    insert into subscription (user_id, tier, status) values (new.id, 'free', 'active')
      on conflict (user_id) do nothing;
  end if;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();
