-- Manual kill switch for poll-live-scores, independent of the app's own
-- OFF_SEASON toggle (see constants/offSeason.ts). That flag only stops the
-- APP from calling Sportmonks — this cron job polls Sportmonks every 30
-- seconds regardless of whether anyone has the app open, so during the gap
-- between seasons it needs its own off switch, or it keeps hitting the API
-- (and erroring, once the subscription is paused/cancelled) the whole time.
--
-- Singleton table: exactly one row, id is always `true`. Flip it directly —
-- easiest via the Supabase dashboard's Table Editor (poll_config -> enabled
-- checkbox), or via SQL:
--   update public.poll_config set enabled = false; -- pause for the break
--   update public.poll_config set enabled = true;  -- resume for the new season
--
-- The cron schedule itself (poll-live-scores-every-30s) is left running —
-- the edge function checks this flag first and returns immediately without
-- calling Sportmonks when disabled, so there's nothing to re-schedule when
-- the season starts again.

create table if not exists public.poll_config (
  id boolean primary key default true,
  enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  constraint poll_config_singleton check (id)
);

insert into public.poll_config (id, enabled)
values (true, true)
on conflict (id) do nothing;

alter table public.poll_config enable row level security;

create trigger poll_config_set_updated_at
  before update on public.poll_config
  for each row
  execute function public.set_updated_at();
