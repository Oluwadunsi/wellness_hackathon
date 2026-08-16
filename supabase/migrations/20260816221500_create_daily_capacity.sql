create table public.daily_capacity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  capacity_date date not null,
  level text not null check (level in ('low', 'normal', 'high')),
  note text check (note is null or char_length(trim(note)) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, capacity_date)
);

create index daily_capacity_user_date_index on public.daily_capacity (user_id, capacity_date);
alter table public.daily_capacity enable row level security;

create policy "Users can view their own daily capacity"
  on public.daily_capacity for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own daily capacity"
  on public.daily_capacity for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own daily capacity"
  on public.daily_capacity for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own daily capacity"
  on public.daily_capacity for delete to authenticated
  using ((select auth.uid()) = user_id);

create trigger set_daily_capacity_updated_at
before update on public.daily_capacity
for each row execute function public.set_updated_at();
