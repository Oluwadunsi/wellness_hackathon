alter table public.tasks add column planned_date date;
create index tasks_user_planned_date_status_index
  on public.tasks (user_id, planned_date, status);
