create table public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 1 and 80),
  default_capacity text not null default 'normal' check (default_capacity in ('low', 'normal', 'high')),
  protect_personal_time boolean not null default true,
  timezone text not null default 'Europe/Stockholm',
  onboarding_completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;
create policy "Users can view their own profile" on public.user_profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can create their own profile" on public.user_profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their own profile" on public.user_profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create trigger set_user_profiles_updated_at before update on public.user_profiles
for each row execute function public.set_updated_at();
