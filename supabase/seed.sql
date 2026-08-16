-- Development/demo data for AuraPlan.
-- This file intentionally assigns records to the oldest Supabase Auth user.
-- Do not run it against a production project containing real user data.

do $$
declare
  seed_user_id uuid;
begin
  select id
  into seed_user_id
  from auth.users
  order by created_at asc
  limit 1;

  if seed_user_id is null then
    raise exception 'No Supabase Auth user exists. Create one in Authentication > Users before running seed.sql.';
  end if;

  insert into public.calendar_events (
    user_id,
    external_event_id,
    source,
    title,
    starts_at,
    ends_at,
    is_all_day,
    calendar_name
  )
  values
    (
      seed_user_id,
      'auraplan-demo-project-sync',
      'google',
      'Project sync',
      timezone('Europe/Stockholm', current_date + time '10:00'),
      timezone('Europe/Stockholm', current_date + time '11:30'),
      false,
      'Google Calendar'
    ),
    (
      seed_user_id,
      'auraplan-demo-lunch',
      'google',
      'Lunch with Maya',
      timezone('Europe/Stockholm', current_date + time '12:30'),
      timezone('Europe/Stockholm', current_date + time '13:30'),
      false,
      'Google Calendar'
    )
  on conflict (user_id, source, external_event_id)
  do update set
    title = excluded.title,
    starts_at = excluded.starts_at,
    ends_at = excluded.ends_at,
    calendar_name = excluded.calendar_name,
    updated_at = now();

  delete from public.calendar_events
  where user_id = seed_user_id
    and external_event_id = 'auraplan-demo-evening-walk';

  if not exists (
    select 1
    from public.tasks
    where user_id = seed_user_id
      and raw_input = 'Finish the quarterly report by Thursday.'
  ) then
    insert into public.tasks (
      user_id,
      raw_input,
      title,
      duration_minutes,
      deadline,
      effort,
      preferred_period,
      splittable,
      wellbeing_priority,
      labels,
      status
    )
    values (
      seed_user_id,
      'Finish the quarterly report by Thursday.',
      'Quarterly report',
      120,
      (current_date + 4) + time '17:00',
      'high',
      'morning',
      true,
      null,
      array['Work'],
      'pending'
    );
  end if;

  raise notice 'AuraPlan seed data added for user %', seed_user_id;
end;
$$;
