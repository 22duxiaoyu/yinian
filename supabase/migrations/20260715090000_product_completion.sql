alter table public.notes
  add column if not exists source_insight_key text,
  add column if not exists result_text text not null default '',
  add column if not exists result_outcome text check (result_outcome in ('supported', 'unclear', 'disproved')),
  add column if not exists completed_at timestamptz;

alter table public.insights
  add column if not exists decided_at timestamptz;

create index if not exists notes_user_source_insight_idx
  on public.notes(user_id, source_insight_key)
  where source_insight_key is not null;

delete from public.insights old_row
using public.insights new_row
where old_row.user_id = new_row.user_id
  and old_row.insight_key = 'insight-1'
  and new_row.insight_key = 'pattern';
delete from public.insights old_row
using public.insights new_row
where old_row.user_id = new_row.user_id
  and old_row.insight_key = 'insight-2'
  and new_row.insight_key = 'tension';
delete from public.insights old_row
using public.insights new_row
where old_row.user_id = new_row.user_id
  and old_row.insight_key = 'insight-3'
  and new_row.insight_key = 'change';

update public.insights set insight_key = 'pattern' where insight_key = 'insight-1';
update public.insights set insight_key = 'tension' where insight_key = 'insight-2';
update public.insights set insight_key = 'change' where insight_key = 'insight-3';
update public.notes set source_insight_key = 'pattern' where source_insight_key = 'insight-1';
update public.notes set source_insight_key = 'tension' where source_insight_key = 'insight-2';
update public.notes set source_insight_key = 'change' where source_insight_key = 'insight-3';

create table if not exists public.insight_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  insight_key text not null,
  insight_title text not null,
  insight_topic text not null default '',
  decision text not null check (decision in ('confirmed', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists insight_feedback_user_created_idx
  on public.insight_feedback(user_id, created_at desc);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  anonymous_id text,
  event_name text not null check (event_name ~ '^[a-z0-9_]{3,64}$'),
  page text not null default '',
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (user_id is not null or anonymous_id is not null)
);

create index if not exists analytics_events_user_created_idx
  on public.analytics_events(user_id, created_at desc);
create index if not exists analytics_events_name_created_idx
  on public.analytics_events(event_name, created_at desc);

create table if not exists public.product_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  score integer not null check (score between 1 and 5),
  category text not null default 'general',
  message text not null default '',
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.insight_feedback enable row level security;
alter table public.analytics_events enable row level security;
alter table public.product_feedback enable row level security;

create policy "insight_feedback_select_own" on public.insight_feedback
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "insight_feedback_insert_own" on public.insight_feedback
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "analytics_events_select_own" on public.analytics_events
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "analytics_events_insert_own" on public.analytics_events
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "product_feedback_select_own" on public.product_feedback
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "product_feedback_insert_own" on public.product_feedback
  for insert to authenticated with check ((select auth.uid()) = user_id);

grant select, insert on public.insight_feedback to authenticated;
grant select, insert on public.analytics_events to authenticated;
grant select, insert on public.product_feedback to authenticated;

create or replace view public.analytics_funnel_daily
with (security_invoker = true)
as
select
  user_id,
  created_at::date as event_date,
  count(*) filter (where event_name = 'auth_completed') as auth_completed,
  count(*) filter (where event_name = 'source_saved') as sources_saved,
  count(*) filter (where event_name = 'insight_analysis_completed') as analyses_completed,
  count(*) filter (where event_name = 'insight_evidence_opened') as evidence_opened,
  count(*) filter (where event_name = 'insight_confirmed') as insights_confirmed,
  count(*) filter (where event_name = 'insight_converted_to_action') as insights_converted,
  count(*) filter (where event_name = 'action_result_saved') as action_results_saved,
  count(*) filter (where event_name = 'weekly_report_viewed') as weekly_reports_viewed
from public.analytics_events
where user_id is not null
group by user_id, created_at::date;

grant select on public.analytics_funnel_daily to authenticated;

do $$
declare
  table_name text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach table_name in array array['insight_feedback', 'product_feedback'] loop
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
