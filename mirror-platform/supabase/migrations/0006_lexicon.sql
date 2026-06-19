-- ============================================================================
-- The Mirror Platform — 0006 lexicon (P6)
-- The §A term record + the §B term-DAG, as a sibling graph of the same shape as
-- the corpus. CORPUS class: world-readable, architect-written (service role).
-- `requires` is rigid and acyclic — the firewall, in vocabulary (§B). Forward
-- refs / dangles are allowed (the sweep declares requires before a region is
-- swept), so the dependency targets are NOT hard FKs — the audit catches dangles.
-- ============================================================================

do $$ begin
  create type collision     as enum ('none','mild','inverts');
  create type disposition   as enum ('experience','demote','teach','banned');
  create type gloss_verdict as enum ('untested','carried','derived');
exception when duplicate_object then null; end $$;

create table term (
  term              text primary key,            -- the lemma / stable id (slug-stable, §G.6)
  surface_forms     text[] not null default '{}',
  register          text not null default 'transmission',
  our_meaning       text,
  defines_node      text,                         -- -> node(node_id); soft (forward refs allowed)
  reader_assumptions text[] not null default '{}',
  collision         collision not null default 'none',
  disposition       disposition not null default 'teach',
  plain             text,                         -- only when disposition='demote'
  first_gloss       text,                         -- only when disposition='teach' (authored, §G.4)
  tier0             boolean not null default false,
  arrival_early     text[] not null default '{}',
  gloss_verdict     gloss_verdict not null default 'untested',
  gloss_refuter     text,                         -- null = seal-risk if carried/derived (§G.5)
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index term_disposition_idx on term(disposition);
create index term_defines_idx on term(defines_node);
create trigger term_touch before update on term
  for each row execute function touch_updated_at();

-- the term-DAG edge (§B): from_term `requires` to_term. from_term must exist;
-- to_term is soft (forward refs / dangles allowed).
create table term_edge (
  id        uuid primary key default gen_random_uuid(),
  from_term text not null references term(term) on update cascade,
  to_term   text not null,
  kind      text not null default 'requires' check (kind = 'requires'),
  created_at timestamptz not null default now(),
  unique (from_term, to_term, kind),
  check (from_term <> to_term)                    -- a term may not require itself (§B)
);
create index term_edge_from_idx on term_edge(from_term);
create index term_edge_to_idx on term_edge(to_term);

-- ── the vocabulary firewall: `requires` is acyclic (§B) ────────────────────
create or replace function term_no_cycle() returns trigger
language plpgsql as $$
begin
  if exists (
    with recursive reach(t) as (
      select new.to_term
      union
      select te.to_term from term_edge te join reach r on te.from_term = r.t
    )
    select 1 from reach where t = new.from_term
  ) then
    raise exception
      'TERM FIREWALL: % requires % would create a term-DAG cycle; one of them is the plainer entry (§B).',
      new.from_term, new.to_term using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger term_no_cycle_t before insert or update on term_edge
  for each row execute function term_no_cycle();

-- ── RLS: corpus — world-readable, never client-writable ────────────────────
alter table term      enable row level security;
alter table term_edge enable row level security;
grant select on term, term_edge to anon, authenticated;
create policy term_read      on term      for select to anon, authenticated using (true);
create policy term_edge_read on term_edge for select to anon, authenticated using (true);
-- no write policies -> client writes denied by default; the architect lexicon
-- edge function (service role) writes and re-validates acyclicity (§F).
