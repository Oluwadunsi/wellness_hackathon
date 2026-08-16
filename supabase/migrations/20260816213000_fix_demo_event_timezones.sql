-- The original demo timestamps were timestamp-without-time-zone values that
-- PostgreSQL interpreted using the database timezone (UTC). Re-save only the
-- known demo events as Europe/Stockholm wall-clock times.
update public.calendar_events
set
  starts_at = timezone('Europe/Stockholm', (starts_at at time zone 'UTC')::date + time '10:00'),
  ends_at = timezone('Europe/Stockholm', (ends_at at time zone 'UTC')::date + time '11:30'),
  updated_at = now()
where external_event_id = 'auraplan-demo-project-sync';

update public.calendar_events
set
  starts_at = timezone('Europe/Stockholm', (starts_at at time zone 'UTC')::date + time '12:30'),
  ends_at = timezone('Europe/Stockholm', (ends_at at time zone 'UTC')::date + time '13:30'),
  updated_at = now()
where external_event_id = 'auraplan-demo-lunch';
