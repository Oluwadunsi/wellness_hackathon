create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  external_event_id text,
  source text not null check (source in ('google', 'manual', 'auraplan')),
  title text not null check (char_length(trim(title)) between 1 and 200),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_all_day boolean not null default false,
  calendar_name text check (
    calendar_name is null or char_length(trim(calendar_name)) between 1 and 100
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint calendar_events_valid_time check (ends_at > starts_at)
);

create unique index calendar_events_external_event_unique
  on public.calendar_events (user_id, source, external_event_id);

create index calendar_events_user_start_index
  on public.calendar_events (user_id, starts_at);

alter table public.calendar_events enable row level security;

create policy "Users can view their own calendar events"
  on public.calendar_events
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own calendar events"
  on public.calendar_events
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own calendar events"
  on public.calendar_events
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own calendar events"
  on public.calendar_events
  for delete
  to authenticated
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

create trigger set_calendar_events_updated_at
before update on public.calendar_events
for each row execute function public.set_updated_at();
