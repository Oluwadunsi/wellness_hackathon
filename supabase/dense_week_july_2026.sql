-- Fully packed test week: Monday 6 July through Sunday 12 July 2026.
-- Run after the planned_date migration.

do $$
declare
  demo_user_id uuid;
  demo_day date;
  day_offset integer;
begin
  select id into demo_user_id from auth.users order by created_at asc limit 1;
  if demo_user_id is null then
    raise exception 'Create an Authentication user before running this script.';
  end if;

  for day_offset in 0..6 loop
    demo_day := date '2026-07-06' + day_offset;
    if day_offset < 5 then
      insert into public.calendar_events (
        user_id, external_event_id, source, title, starts_at, ends_at, is_all_day, calendar_name
      ) values
        (demo_user_id, format('dense-%s-commute', demo_day), 'google', 'Morning commute', timezone('Europe/Stockholm', demo_day + time '08:00'), timezone('Europe/Stockholm', demo_day + time '08:45'), false, 'Work'),
        (demo_user_id, format('dense-%s-standup', demo_day), 'google', 'Team stand-up', timezone('Europe/Stockholm', demo_day + time '09:00'), timezone('Europe/Stockholm', demo_day + time '09:30'), false, 'Work'),
        (demo_user_id, format('dense-%s-client', demo_day), 'google', 'Client call', timezone('Europe/Stockholm', demo_day + time '10:00'), timezone('Europe/Stockholm', demo_day + time '11:00'), false, 'Work'),
        (demo_user_id, format('dense-%s-workshop', demo_day), 'google', 'Planning workshop', timezone('Europe/Stockholm', demo_day + time '11:15'), timezone('Europe/Stockholm', demo_day + time '12:30'), false, 'Work'),
        (demo_user_id, format('dense-%s-lunch', demo_day), 'google', 'Lunch meeting', timezone('Europe/Stockholm', demo_day + time '12:30'), timezone('Europe/Stockholm', demo_day + time '13:30'), false, 'Work'),
        (demo_user_id, format('dense-%s-review', demo_day), 'google', 'Project review', timezone('Europe/Stockholm', demo_day + time '14:00'), timezone('Europe/Stockholm', demo_day + time '15:30'), false, 'Work'),
        (demo_user_id, format('dense-%s-stakeholder', demo_day), 'google', 'Stakeholder sync', timezone('Europe/Stockholm', demo_day + time '16:00'), timezone('Europe/Stockholm', demo_day + time '17:00'), false, 'Work'),
        (demo_user_id, format('dense-%s-evening', demo_day), 'google', 'Evening class', timezone('Europe/Stockholm', demo_day + time '18:30'), timezone('Europe/Stockholm', demo_day + time '20:00'), false, 'Personal')
      on conflict (user_id, source, external_event_id) do update set
        title = excluded.title, starts_at = excluded.starts_at, ends_at = excluded.ends_at,
        calendar_name = excluded.calendar_name, updated_at = now();

      insert into public.tasks (
        user_id, raw_input, title, duration_minutes, deadline, effort,
        preferred_period, splittable, wellbeing_priority, labels, status, planned_date
      ) values
        (demo_user_id, 'Clear urgent messages before the first meeting.', 'Clear urgent messages', 30, timezone('Europe/Stockholm', demo_day + time '10:00'), 'low', 'morning', false, null, array['Work'], 'pending', demo_day),
        (demo_user_id, 'Finish the proposal before the end of the workday.', 'Finish proposal', 75, timezone('Europe/Stockholm', demo_day + time '17:30'), 'high', 'afternoon', true, null, array['Work'], 'pending', demo_day),
        (demo_user_id, 'Complete follow-ups tonight.', 'Complete follow-ups', 45, timezone('Europe/Stockholm', demo_day + time '21:30'), 'medium', 'evening', false, null, array['Work'], 'pending', demo_day);
    else
      insert into public.calendar_events (
        user_id, external_event_id, source, title, starts_at, ends_at, is_all_day, calendar_name
      ) values
        (demo_user_id, format('dense-%s-errands', demo_day), 'google', 'Errands across town', timezone('Europe/Stockholm', demo_day + time '09:00'), timezone('Europe/Stockholm', demo_day + time '10:30'), false, 'Personal'),
        (demo_user_id, format('dense-%s-family', demo_day), 'google', 'Family commitment', timezone('Europe/Stockholm', demo_day + time '11:00'), timezone('Europe/Stockholm', demo_day + time '13:00'), false, 'Personal'),
        (demo_user_id, format('dense-%s-lunch', demo_day), 'google', 'Lunch reservation', timezone('Europe/Stockholm', demo_day + time '13:30'), timezone('Europe/Stockholm', demo_day + time '15:00'), false, 'Personal'),
        (demo_user_id, format('dense-%s-social', demo_day), 'google', 'Plans with friends', timezone('Europe/Stockholm', demo_day + time '16:00'), timezone('Europe/Stockholm', demo_day + time '18:00'), false, 'Personal'),
        (demo_user_id, format('dense-%s-event', demo_day), 'google', 'Evening event', timezone('Europe/Stockholm', demo_day + time '19:00'), timezone('Europe/Stockholm', demo_day + time '21:00'), false, 'Personal')
      on conflict (user_id, source, external_event_id) do update set
        title = excluded.title, starts_at = excluded.starts_at, ends_at = excluded.ends_at,
        calendar_name = excluded.calendar_name, updated_at = now();

      insert into public.tasks (
        user_id, raw_input, title, duration_minutes, deadline, effort,
        preferred_period, splittable, wellbeing_priority, labels, status, planned_date
      ) values
        (demo_user_id, 'Do the laundry in the morning.', 'Do laundry', 45, null, 'low', 'morning', true, null, array['Personal'], 'pending', demo_day),
        (demo_user_id, 'Prepare for the coming week in the evening.', 'Prepare for next week', 60, null, 'medium', 'evening', true, null, array['Personal'], 'pending', demo_day);
    end if;
  end loop;

  raise notice 'Dense demo week created for user % from 2026-07-06 through 2026-07-12', demo_user_id;
end;
$$;
