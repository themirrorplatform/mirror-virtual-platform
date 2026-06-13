-- The Deep Read — witness list.
-- Anyone may add themselves (anon INSERT); no one but the service role may read.
-- RLS is the security boundary, so the publishable anon key is safe in the browser.

create extension if not exists citext;

create table if not exists public.witnesses (
  id          uuid        primary key default gen_random_uuid(),
  email       citext      not null unique,
  name        text,
  source      text        not null default 'site',
  user_agent  text,
  created_at  timestamptz not null default now(),
  constraint witnesses_email_format
    check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')
);

alter table public.witnesses enable row level security;

-- anon may INSERT a seat and nothing else. With RLS on and no SELECT/UPDATE/DELETE
-- policy, every other operation is denied by default. service_role bypasses RLS
-- for the admin/export side.
drop policy if exists witnesses_anon_insert on public.witnesses;
create policy witnesses_anon_insert
  on public.witnesses
  for insert
  to anon
  with check (true);

-- Table privileges: anon can write only these columns, can never read.
revoke all on public.witnesses from anon;
grant insert (email, name, source, user_agent) on public.witnesses to anon;
