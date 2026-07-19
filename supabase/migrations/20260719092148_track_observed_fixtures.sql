-- Replaces the flawed "processed_events has no rows for this fixture" catch-up
-- proxy. That proxy only ever wrote a row once a fixture had a qualifying
-- goal/red/FT candidate, so a scoreless fixture never got one at all — its
-- "first observation" check re-triggered on whichever event happened to be
-- its first ever, no matter how late in the match, silently seeding it.
--
-- observed_fixtures records, once and permanently (until cleanup), whether a
-- fixture's FIRST-EVER sighting was already meaningfully underway. That
-- decision is looked up on every later poll regardless of whether the
-- fixture has any events that poll, so a fixture observed early always
-- notifies normally for the rest of its life — including a 0-0 game's FT.

create table if not exists public.observed_fixtures (
  fixture_id bigint primary key,
  first_seen_at timestamptz not null default now(),
  seeded boolean not null
);

alter table public.observed_fixtures enable row level security;

-- Extend daily housekeeping to also prune observed_fixtures. cron.schedule
-- with an existing job name replaces that job's command, so this is safe to
-- re-run.
select cron.schedule(
  'poll-live-scores-cleanup-daily',
  '0 3 * * *',
  $$
  delete from public.processed_events where sent_at < now() - interval '7 days';
  delete from public.observed_fixtures where first_seen_at < now() - interval '7 days';
  delete from net._http_response where created < now() - interval '7 days';
  $$
);
