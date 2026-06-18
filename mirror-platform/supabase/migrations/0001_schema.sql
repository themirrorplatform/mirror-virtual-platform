-- ============================================================================
-- The Mirror Platform — 0001 schema (P2)
-- Everything Spec §4.1 (the node schema = single source of truth), §5 (data
-- model), and the Data-Permanence Spec §1 (the CORPUS / PERSON split).
--
-- DESIGN: "Everything is a node" (§4). There is ONE `node` table — the single
-- source of truth for the §4.1 fields. `thread` and `construction` are the two
-- PRESENTATIONS of a node (the A-page and the B-page); a node may have either,
-- both, or neither (a bare claim/leaf). Edges live in their own table so the
-- reverse "leads to" query and the acyclicity check are clean (§5).
--
-- The CORPUS/PERSON firewall (Permanence §1) is physical here: corpus tables
-- carry no PII and attribute to a chosen `handle`; person tables carry identity
-- and are the only erasable class. The one delete operation (§3) lives in 0002.
-- ============================================================================

create extension if not exists "pgcrypto";   -- gen_random_uuid()

-- ---- enums (the frozen vocabularies) --------------------------------------
do $$ begin
  create type kind            as enum ('attempt','leaf/borrow','code','definition');
  create type stage           as enum ('captured','has_result','in_protocol','verdict_in','on_graph');
  create type register        as enum ('live','confirms');
  create type verdict_source  as enum ('carried','internal-rederivation','derived');
  create type depth_tier      as enum ('metric','load-bearing','province','shallow');
  create type edge_type       as enum ('rests_on','pulls_to');
  create type engagement      as enum ('unread','read','integrated','openly_discussed');
  create type presence        as enum ('active','departed');
  create type conduct_status  as enum ('live','withdrawn-for-conduct');
  create type tier            as enum ('free','continuations','builder','patron');
  create type sub_status      as enum ('active','trialing','past_due','canceled','incomplete');
exception when duplicate_object then null; end $$;

-- updated_at touch helper
create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ===========================================================================
-- CORPUS CLASS — permanent, PII-free, attributed to a handle, never deleted.
-- ===========================================================================

-- The handle is the hinge (Permanence §0): the public author of all corpus,
-- containing no PII. Erasing a person never touches this row.
create table handle (
  handle        text primary key,                 -- e.g. 'a-reflection', 'w-3'
  display       text not null,
  is_architect  boolean not null default false,
  created_at    timestamptz not null default now()
);

-- The node — the single source of truth for the §4.1 schema.
create table node (
  id              uuid primary key default gen_random_uuid(),
  node_id         text unique not null,            -- the public handle, e.g. 'B1-§53'
  label           text not null,                   -- what it tried to do, author's register
  kind            kind not null default 'attempt',
  content_home    text not null,                   -- primary basin
  content_reaches text[] not null default '{}',    -- other basins it reaches
  substrate       text[] not null default '{}',    -- thought|emotion|belief|experience
  register        register not null default 'live',
  stage           stage not null default 'captured',
  verdict         text,                            -- a LABEL, never a gate (§4.3). null = untested
  verdict_source  verdict_source,                  -- only external encounter earns 'derived'
  refuter         text,                            -- null = seal-risk if HOLDS/HELD (§47)
  -- COMPUTED, cached on write, never the source of truth (§0, §4.3):
  cached_load_direct  integer not null default 0,
  cached_load_trans   integer not null default 0,  -- structural load = transitive dependents
  cached_depth        depth_tier,
  -- attribution + builder lifecycle (§4.1, Conduct §2):
  author_handle   text not null references handle(handle),
  engagement      engagement,                      -- builder nodes only
  presence        presence,                        -- builder nodes only
  determination   text,                            -- architect's reading after departure
  conduct_status  conduct_status not null default 'live',
  flags           text[] not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index node_register_idx on node(register);
create index node_stage_idx on node(stage);
create index node_author_idx on node(author_handle);
create index node_home_idx on node(content_home);
create trigger node_touch before update on node
  for each row execute function touch_updated_at();

-- Edges: explicit (source, target, type) — cleaner for the reverse query and
-- the firewall trigger (§5). rests_on = construction DAG (acyclic); pulls_to =
-- encounter flow (may cycle). The acyclicity trigger lives in 0002.
create table edge (
  id        uuid primary key default gen_random_uuid(),
  source    text not null references node(node_id) on update cascade,
  target    text not null references node(node_id) on update cascade,
  type      edge_type not null,
  flags     text[] not null default '{}',          -- e.g. 'provisional-edge'
  created_at timestamptz not null default now(),
  unique (source, target, type),
  check (source <> target)
);
create index edge_source_idx on edge(source, type);
create index edge_target_idx on edge(target, type);   -- powers reverse "leads to"

-- thread — the A-page presentation of a node (continuation / wing-entry).
create table thread (
  node_id      text primary key references node(node_id) on update cascade,
  slug         text unique not null,
  title        text not null,
  body         jsonb,                               -- TipTap JSON
  arrived_from text,                                -- 'lesswrong'|'ea'|'substack-grief'|...
  basin        text,
  featured     boolean not null default false,      -- drives the derived "Now" list
  published    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index thread_featured_idx on thread(featured) where featured;
create index thread_published_idx on thread(published) where published;
create trigger thread_touch before update on thread
  for each row execute function touch_updated_at();

-- construction — the B-page presentation (proof/theorem/book section). Gated.
create table construction (
  node_id    text primary key references node(node_id) on update cascade,
  slug       text unique not null,
  title      text not null,
  body       jsonb,
  min_tier   tier not null default 'continuations', -- read gate (§6); RLS enforces
  published  boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index construction_published_idx on construction(published) where published;
create trigger construction_touch before update on construction
  for each row execute function touch_updated_at();

-- membrane — a content node inside a thread pointing at a construction (§3, §5).
create table membrane (
  id            uuid primary key default gen_random_uuid(),
  thread_id     text not null references thread(node_id) on update cascade,
  construction_id text not null references construction(node_id) on update cascade,
  teaser        text not null,
  position      integer not null default 0,         -- position-in-body
  created_at    timestamptz not null default now()
);
create index membrane_thread_idx on membrane(thread_id);

-- map_entry — the atlas (§11).
create table map_entry (
  id        uuid primary key default gen_random_uuid(),
  domain    text not null,
  verb      text not null check (verb in ('dissolves','diagnoses','reframes','applies')),
  owes      text,                                    -- "what it owes"
  status    text not null default 'coming' check (status in ('built','coming')),
  node_id   text references node(node_id) on update cascade,
  created_at timestamptz not null default now()
);

-- forum_post — corpus (permanent), email-gated, conduct-withdrawable (§10).
create table forum_post (
  id        uuid primary key default gen_random_uuid(),
  author_handle  text not null references handle(handle),
  body      text not null,
  parent_id uuid references forum_post(id),
  conduct_status conduct_status not null default 'live',
  created_at timestamptz not null default now()
);
create index forum_parent_idx on forum_post(parent_id);

-- removal — the self-binding audit log (§10, Conduct §3). conduct reason ONLY;
-- a content reason is structurally forbidden (the check).
create table removal (
  id        uuid primary key default gen_random_uuid(),
  target_kind text not null check (target_kind in ('forum_post','node')),
  target_id   text not null,
  actor       text not null default 'architect',
  conduct_reason text not null,
  content_reason  text check (content_reason is null),  -- forbidden, always null
  created_at  timestamptz not null default now()
);

-- commit_ledger — the why-ledger (§8): the recomputation diff of each write,
-- append-only, as displayable proof-steps. History, not declaration.
create table commit_ledger (
  id          uuid primary key default gen_random_uuid(),
  node_id     text,
  summary     text not null,
  diff        jsonb not null default '{}',           -- captured/edges/firewall/load/depth/seal
  created_at  timestamptz not null default now()
);

-- ===========================================================================
-- PERSON CLASS — identity, erasable on lawful request (Permanence §1, §3).
-- ===========================================================================

-- app_user — the legal identity, linked to a chosen handle. Erasing this row
-- (the single delete path, 0002) leaves the corpus intact under the handle.
create table app_user (
  id           uuid primary key,                     -- = auth.users.id
  email        text,
  handle       text references handle(handle),
  created_at   timestamptz not null default now(),
  erased_at    timestamptz                           -- set by the erasure function
);

create table subscription (
  user_id      uuid primary key references app_user(id) on delete cascade,
  tier         tier not null default 'free',
  status       sub_status not null default 'active',
  stripe_customer_id     text,
  stripe_subscription_id text,
  cancel_at    timestamptz,
  updated_at   timestamptz not null default now()
);
create trigger subscription_touch before update on subscription
  for each row execute function touch_updated_at();

-- event — the third geometry: append-only behavioral log (§4.2). RAW per-actor
-- is PERSON class (erasable); aggregate/anonymized rollups are corpus (§1).
create table event (
  id        bigint generated always as identity primary key,
  ts        timestamptz not null default now(),
  actor     uuid references app_user(id),            -- null = anonymous/system
  kind      text not null,                           -- read|entry|continuation|status|gloss_shown|...
  node_id   text,
  payload   jsonb not null default '{}'
);
create index event_actor_idx on event(actor);
create index event_node_idx on event(node_id);
create index event_kind_idx on event(kind);

-- ===========================================================================
-- DERIVED READ VIEW — assembles a node into the §4.1 shape the TS engine wants
-- (rests_on / pulls_to as arrays), so the client fetches one shape and runs the
-- exact same compute it does in engine.ts. Navigation is derived, not stored.
-- ===========================================================================
create or replace view node_graph as
select
  n.node_id, n.label, n.kind, n.content_home, n.content_reaches, n.substrate,
  n.register, n.stage, n.verdict, n.verdict_source, n.refuter,
  n.cached_load_direct, n.cached_load_trans, n.cached_depth,
  n.author_handle, n.engagement, n.presence, n.conduct_status, n.flags,
  coalesce((select array_agg(e.target order by e.target)
            from edge e where e.source = n.node_id and e.type = 'rests_on'), '{}') as rests_on,
  coalesce((select array_agg(e.target order by e.target)
            from edge e where e.source = n.node_id and e.type = 'pulls_to'), '{}') as pulls_to,
  coalesce((select array_agg(e.source order by e.source)
            from edge e where e.target = n.node_id and e.type = 'rests_on'), '{}') as leads_to
from node n;
