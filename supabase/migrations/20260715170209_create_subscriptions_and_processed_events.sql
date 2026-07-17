-- Push notification subscriptions and event de-dup tracking.
-- All access goes through edge functions using the service role key, which
-- bypasses RLS entirely — RLS is enabled here with zero policies so that
-- anon/authenticated clients get default-deny if they're ever pointed at
-- these tables directly (e.g. via PostgREST) in the future.

create table if not exists public.subscriptions (
  id bigint generated always as identity primary key,
  push_token text not null unique,
  platform text not null,
  team_ids bigint[] not null default '{}',
  locale text not null default 'is',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_team_ids_idx
  on public.subscriptions using gin (team_ids);

create table if not exists public.processed_events (
  event_id bigint primary key,
  fixture_id bigint not null,
  sent_at timestamptz not null default now()
);

create index if not exists processed_events_fixture_id_idx
  on public.processed_events (fixture_id);

alter table public.subscriptions enable row level security;
alter table public.processed_events enable row level security;

-- Keep updated_at current on every row update.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row
  execute function public.set_updated_at();
