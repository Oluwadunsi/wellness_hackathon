create table public.generated_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_date date not null,
  capacity_level text not null
    check (capacity_level in ('low', 'normal', 'high')),
  status text not null default 'draft'
    check (status in ('draft', 'saved')),
  explanation text
    check (explanation is null or char_length(trim(explanation)) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, plan_date)
);

create table public.schedule_blocks (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.generated_schedules(id) on delete cascade,
  source_type text not null
    check (source_type in ('calendar', 'task', 'meal', 'break', 'wellness', 'personal')),
  source_id uuid,
  title text not null check (char_length(trim(title)) between 1 and 200),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_fixed boolean not null default false,
  is_protected boolean not null default false,
  energy_impact text not null
    check (energy_impact in ('low', 'medium', 'high', 'restorative')),
  status text not null default 'proposed'
    check (status in ('proposed', 'accepted', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint schedule_blocks_valid_time check (ends_at > starts_at)
);

create index generated_schedules_user_date_index
  on public.generated_schedules (user_id, plan_date);

create index schedule_blocks_schedule_start_index
  on public.schedule_blocks (schedule_id, starts_at);

alter table public.generated_schedules enable row level security;
alter table public.schedule_blocks enable row level security;

create policy "Users can view their own generated schedules"
  on public.generated_schedules for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own generated schedules"
  on public.generated_schedules for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own generated schedules"
  on public.generated_schedules for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own generated schedules"
  on public.generated_schedules for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can view blocks in their own schedules"
  on public.schedule_blocks for select to authenticated
  using (
    exists (
      select 1
      from public.generated_schedules
      where generated_schedules.id = schedule_blocks.schedule_id
        and generated_schedules.user_id = (select auth.uid())
    )
  );

create policy "Users can create blocks in their own schedules"
  on public.schedule_blocks for insert to authenticated
  with check (
    exists (
      select 1
      from public.generated_schedules
      where generated_schedules.id = schedule_blocks.schedule_id
        and generated_schedules.user_id = (select auth.uid())
    )
  );

create policy "Users can update blocks in their own schedules"
  on public.schedule_blocks for update to authenticated
  using (
    exists (
      select 1
      from public.generated_schedules
      where generated_schedules.id = schedule_blocks.schedule_id
        and generated_schedules.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.generated_schedules
      where generated_schedules.id = schedule_blocks.schedule_id
        and generated_schedules.user_id = (select auth.uid())
    )
  );

create policy "Users can delete blocks in their own schedules"
  on public.schedule_blocks for delete to authenticated
  using (
    exists (
      select 1
      from public.generated_schedules
      where generated_schedules.id = schedule_blocks.schedule_id
        and generated_schedules.user_id = (select auth.uid())
    )
  );

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

create trigger set_generated_schedules_updated_at
before update on public.generated_schedules
for each row execute function public.set_updated_at();

create trigger set_schedule_blocks_updated_at
before update on public.schedule_blocks
for each row execute function public.set_updated_at();

create or replace function public.save_generated_schedule(
  p_plan_date date,
  p_capacity_level text,
  p_explanation text,
  p_blocks jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_schedule_id uuid;
  block jsonb;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_capacity_level not in ('low', 'normal', 'high') then
    raise exception 'Invalid capacity level';
  end if;

  if jsonb_typeof(p_blocks) <> 'array' then
    raise exception 'Blocks must be a JSON array';
  end if;

  insert into public.generated_schedules (
    user_id,
    plan_date,
    capacity_level,
    explanation
  )
  values (
    auth.uid(),
    p_plan_date,
    p_capacity_level,
    nullif(trim(p_explanation), '')
  )
  on conflict (user_id, plan_date)
  do update set
    capacity_level = excluded.capacity_level,
    explanation = excluded.explanation,
    status = 'draft',
    updated_at = now()
  returning id into v_schedule_id;

  delete from public.schedule_blocks
  where schedule_blocks.schedule_id = v_schedule_id;

  for block in select value from jsonb_array_elements(p_blocks)
  loop
    insert into public.schedule_blocks (
      schedule_id,
      source_type,
      source_id,
      title,
      starts_at,
      ends_at,
      is_fixed,
      is_protected,
      energy_impact,
      status
    )
    values (
      v_schedule_id,
      block ->> 'sourceType',
      nullif(block ->> 'sourceId', '')::uuid,
      block ->> 'title',
      (block ->> 'startsAt')::timestamptz,
      (block ->> 'endsAt')::timestamptz,
      coalesce((block ->> 'isFixed')::boolean, false),
      coalesce((block ->> 'isProtected')::boolean, false),
      block ->> 'energyImpact',
      coalesce(block ->> 'status', 'proposed')
    );
  end loop;

  return v_schedule_id;
end;
$$;

grant execute on function public.save_generated_schedule(date, text, text, jsonb)
to authenticated;
