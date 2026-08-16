-- AuraPlan moderately packed demo day.
-- Run after clearing your demo records. Assigns data to the oldest Auth user.

do $$
declare
  demo_user_id uuid;
  demo_date date := current_date;
begin
  select id into demo_user_id
  from auth.users
  order by created_at asc
  limit 1;

  if demo_user_id is null then
    raise exception 'Create an Authentication user before running this script.';
  end if;

  insert into public.calendar_events (
    user_id, external_event_id, source, title, starts_at, ends_at,
    is_all_day, calendar_name
  )
  values
    (
      demo_user_id, 'auraplan-demo-standup', 'google', 'Team stand-up',
      timezone('Europe/Stockholm', demo_date + time '09:00'),
      timezone('Europe/Stockholm', demo_date + time '09:30'),
      false, 'Work'
    ),
    (
      demo_user_id, 'auraplan-demo-project-sync', 'google', 'Project sync',
      timezone('Europe/Stockholm', demo_date + time '11:00'),
      timezone('Europe/Stockholm', demo_date + time '12:00'),
      false, 'Work'
    ),
    (
      demo_user_id, 'auraplan-demo-lunch', 'google', 'Lunch with Maya',
      timezone('Europe/Stockholm', demo_date + time '12:30'),
      timezone('Europe/Stockholm', demo_date + time '13:30'),
      false, 'Personal'
    ),
    (
      demo_user_id, 'auraplan-demo-client-review', 'google', 'Client review',
      timezone('Europe/Stockholm', demo_date + time '15:00'),
      timezone('Europe/Stockholm', demo_date + time '16:00'),
      false, 'Work'
    )
  on conflict (user_id, source, external_event_id)
  do update set
    title = excluded.title,
    starts_at = excluded.starts_at,
    ends_at = excluded.ends_at,
    calendar_name = excluded.calendar_name,
    updated_at = now();

  insert into public.tasks (
    user_id, raw_input, title, duration_minutes, deadline, effort,
    preferred_period, splittable, wellbeing_priority, labels, status, planned_date
  )
  values
    (
      demo_user_id,
      'Finish the presentation draft today while I still have good focus.',
      'Finish presentation draft', 90,
      timezone('Europe/Stockholm', demo_date + time '17:30'),
      'high', 'morning', true, null, array['Work'], 'pending', demo_date
    ),
    (
      demo_user_id,
      'Review and send the meeting notes this afternoon.',
      'Review meeting notes', 45,
      timezone('Europe/Stockholm', demo_date + time '18:00'),
      'medium', 'afternoon', false, null, array['Work'], 'pending', demo_date
    ),
    (
      demo_user_id,
      'Buy groceries this evening.',
      'Buy groceries', 30,
      null, 'low', 'evening', false, null, array['Personal'], 'pending', demo_date
    );

  raise notice 'Moderately packed demo day created for user % on %', demo_user_id, demo_date;
end;
$$;
