-- =============================================================================
-- BuildView — Supabase schema. Paste this whole file into the SQL editor of a
-- fresh Supabase project and run it once.
--
-- One table per app collection, each row: {id, updated_at, data jsonb} where
-- `data` holds the exact application row (id duplicated inside). RLS: any
-- authenticated user may read/write; anonymous users get nothing. Fine-grained
-- per-project policies are future work — app logic enforces permissions today.
-- =============================================================================

create table if not exists users       (id text primary key, updated_at timestamptz not null default now(), data jsonb not null);
create table if not exists projects    (id text primary key, updated_at timestamptz not null default now(), data jsonb not null);
create table if not exists buildings   (id text primary key, updated_at timestamptz not null default now(), data jsonb not null);
create table if not exists floors      (id text primary key, updated_at timestamptz not null default now(), data jsonb not null);
create table if not exists rooms       (id text primary key, updated_at timestamptz not null default now(), data jsonb not null);
create table if not exists tasks       (id text primary key, updated_at timestamptz not null default now(), data jsonb not null);
create table if not exists photos      (id text primary key, updated_at timestamptz not null default now(), data jsonb not null);
create table if not exists issues      (id text primary key, updated_at timestamptz not null default now(), data jsonb not null);
create table if not exists memberships (id text primary key, updated_at timestamptz not null default now(), data jsonb not null);

-- Row Level Security: authenticated users only.
do $$
declare t text;
begin
  foreach t in array array['users','projects','buildings','floors','rooms','tasks','photos','issues','memberships']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "authenticated all" on %I', t);
    execute format('create policy "authenticated all" on %I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- Realtime: stream every change so other devices update live.
do $$
declare t text;
begin
  foreach t in array array['users','projects','buildings','floors','rooms','tasks','photos','issues','memberships']
  loop
    begin
      execute format('alter publication supabase_realtime add table %I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;
