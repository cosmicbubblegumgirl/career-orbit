create table if not exists public.career_plans (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.career_plans enable row level security;

create policy "People can read their own plan"
on public.career_plans for select
using (auth.uid() = user_id);

create policy "People can create their own plan"
on public.career_plans for insert
with check (auth.uid() = user_id);

create policy "People can update their own plan"
on public.career_plans for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "People can delete their own plan"
on public.career_plans for delete
using (auth.uid() = user_id);
