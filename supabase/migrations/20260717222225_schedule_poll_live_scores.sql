-- Schedules poll-live-scores every 30 seconds via pg_cron + pg_net, and adds
-- daily housekeeping so processed_events / pg_net's response log don't grow
-- forever. The ADMIN_TOKEN value itself is NEVER stored here — only its name
-- is referenced, and it's looked up from Supabase Vault at cron run time.
--
-- One-time manual step (not part of this migration, run once via the SQL
-- editor or `supabase db query --linked`):
--
--   select vault.create_secret(
--     '<the real ADMIN_TOKEN value>',
--     'ADMIN_TOKEN',
--     'Bearer token poll-live-scores checks against; used by the pg_cron job.'
--   );

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'poll-live-scores-every-30s',
  '30 seconds',
  $$
  select net.http_post(
    url := 'https://uvykoopznntnlawuvfdf.supabase.co/functions/v1/poll-live-scores',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret from vault.decrypted_secrets where name = 'ADMIN_TOKEN' limit 1
      )
    ),
    timeout_milliseconds := 20000
  ) as request_id;
  $$
);

-- Daily housekeeping, 03:00 UTC:
--   - processed_events only needs to de-dup events we've already sent;
--     nothing reads rows older than a few days.
--   - pg_net's own response log (net._http_response) grows by ~2 rows/minute
--     at this polling frequency and has no bound of its own.
select cron.schedule(
  'poll-live-scores-cleanup-daily',
  '0 3 * * *',
  $$
  delete from public.processed_events where sent_at < now() - interval '7 days';
  delete from net._http_response where created < now() - interval '7 days';
  $$
);
