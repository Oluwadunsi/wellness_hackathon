create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  raw_input text not null check (char_length(trim(raw_input)) between 1 and 2000),
  title text not null check (char_length(trim(title)) between 1 and 200),
  duration_minutes integer not null check (duration_minutes between 5 and 1440),
  deadline timestamptz,
  effort text not null check (effort in ('low', 'medium', 'high')),
  preferred_period text not null default 'flexible'
    check (preferred_period in ('morning', 'afternoon', 'evening', 'flexible')),
  splittable boolean not null default true,
  wellbeing_priority text
    check (wellbeing_priority is null or char_length(trim(wellbeing_priority)) between 1 and 200),
  labels text[] not null default '{}',
  status text not null default 'pending'
    check (status in ('pending', 'scheduled', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_user_status_index on public.tasks (user_id, status);
create index tasks_user_deadline_index on public.tasks (user_id, deadline);

alter table public.tasks enable row level security;

create policy "Users can view their own tasks"
  on public.tasks for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own tasks"
  on public.tasks for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own tasks"
  on public.tasks for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own tasks"
  on public.tasks for delete to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_tasks_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();
