create table if not exists public.agent_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  objective text not null,
  status text not null default 'clarifying' check (status in ('clarifying', 'ready', 'active', 'paused', 'completed', 'cancelled')),
  target_date date,
  success_criteria text not null default '',
  constraints jsonb not null default '{}'::jsonb,
  context jsonb not null default '{}'::jsonb,
  current_plan_version integer not null default 0,
  next_check_in_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references public.agent_goals(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  kind text not null default 'status' check (kind in ('goal', 'clarification', 'plan', 'feedback', 'status')),
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.agent_plan_steps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references public.agent_goals(id) on delete cascade,
  version integer not null default 1,
  position integer not null,
  title text not null,
  detail text not null default '',
  duration_minutes integer not null default 15 check (duration_minutes between 5 and 480),
  due_at timestamptz,
  status text not null default 'proposed' check (status in ('proposed', 'approved', 'in_progress', 'completed', 'skipped')),
  success_criteria text not null default '',
  note_id uuid references public.notes(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(goal_id, version, position)
);

create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid references public.agent_goals(id) on delete set null,
  trigger text not null default 'user' check (trigger in ('user', 'check_in', 'feedback', 'weekly', 'system')),
  status text not null default 'running' check (status in ('running', 'completed', 'failed')),
  phase text not null default '',
  summary text not null default '',
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  error text not null default '',
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.agent_check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references public.agent_goals(id) on delete cascade,
  step_id uuid references public.agent_plan_steps(id) on delete set null,
  due_at timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'answered', 'dismissed', 'overdue')),
  question text not null,
  response text not null default '',
  outcome text not null default '',
  answered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notes
  add column if not exists agent_goal_id uuid references public.agent_goals(id) on delete set null,
  add column if not exists agent_step_id uuid references public.agent_plan_steps(id) on delete set null,
  add column if not exists due_at timestamptz,
  add column if not exists priority text not null default 'normal' check (priority in ('low', 'normal', 'high'));

create index if not exists agent_goals_user_status_idx on public.agent_goals(user_id, status, updated_at desc);
create index if not exists agent_messages_goal_created_idx on public.agent_messages(goal_id, created_at);
create index if not exists agent_plan_steps_goal_position_idx on public.agent_plan_steps(goal_id, version, position);
create index if not exists agent_runs_user_started_idx on public.agent_runs(user_id, started_at desc);
create index if not exists agent_check_ins_user_due_idx on public.agent_check_ins(user_id, status, due_at);
create index if not exists notes_agent_goal_idx on public.notes(user_id, agent_goal_id) where agent_goal_id is not null;

drop trigger if exists agent_goals_updated_at on public.agent_goals;
create trigger agent_goals_updated_at before update on public.agent_goals for each row execute function public.set_updated_at();
drop trigger if exists agent_plan_steps_updated_at on public.agent_plan_steps;
create trigger agent_plan_steps_updated_at before update on public.agent_plan_steps for each row execute function public.set_updated_at();
drop trigger if exists agent_check_ins_updated_at on public.agent_check_ins;
create trigger agent_check_ins_updated_at before update on public.agent_check_ins for each row execute function public.set_updated_at();

alter table public.agent_goals enable row level security;
alter table public.agent_messages enable row level security;
alter table public.agent_plan_steps enable row level security;
alter table public.agent_runs enable row level security;
alter table public.agent_check_ins enable row level security;

create policy "agent_goals_own_all" on public.agent_goals for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "agent_messages_own_all" on public.agent_messages for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "agent_plan_steps_own_all" on public.agent_plan_steps for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "agent_runs_own_all" on public.agent_runs for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "agent_check_ins_own_all" on public.agent_check_ins for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.agent_goals to authenticated;
grant select, insert, update, delete on public.agent_messages to authenticated;
grant select, insert, update, delete on public.agent_plan_steps to authenticated;
grant select, insert, update, delete on public.agent_runs to authenticated;
grant select, insert, update, delete on public.agent_check_ins to authenticated;

do $$
declare
  table_name text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach table_name in array array['agent_goals', 'agent_messages', 'agent_plan_steps', 'agent_check_ins'] loop
      if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = table_name
      ) then
        execute format('alter publication supabase_realtime add table public.%I', table_name);
      end if;
    end loop;
  end if;
end;
$$;
