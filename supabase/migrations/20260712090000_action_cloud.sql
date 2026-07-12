create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '未命名输入',
  content text not null default '',
  type text not null default 'idea' check (type in ('idea', 'diary', 'review', 'task')),
  mood text not null default '清醒',
  tags text[] not null default '{}',
  done boolean not null default false,
  pinned boolean not null default false,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notes_user_updated_idx on public.notes(user_id, updated_at desc);
create index if not exists notes_user_type_idx on public.notes(user_id, type);
create index if not exists notes_tags_idx on public.notes using gin(tags);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  kind text not null default 'Document',
  size_bytes bigint not null default 0,
  status text not null default 'parsed' check (status in ('parsed', 'fallback', 'sample', 'processing', 'failed')),
  summary text not null default '',
  extracted_text text not null default '',
  keywords text[] not null default '{}',
  cards jsonb not null default '[]'::jsonb,
  storage_path text,
  parsed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists documents_user_parsed_idx on public.documents(user_id, parsed_at desc);
create index if not exists documents_keywords_idx on public.documents using gin(keywords);

create table if not exists public.insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  insight_key text not null,
  label text not null default '行为模式',
  topic text not null,
  title text not null,
  detail text not null,
  evidence_count integer not null default 0,
  confidence integer not null default 0 check (confidence between 0 and 100),
  accent text not null default '#667d92',
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected')),
  evidence_refs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, insight_key)
);

create index if not exists insights_user_status_idx on public.insights(user_id, status, updated_at desc);

create table if not exists public.weekly_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  week_end date not null,
  layout text not null default 'balanced' check (layout in ('sparse', 'balanced', 'dense')),
  theme text not null,
  report jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, week_start)
);

create index if not exists weekly_reports_user_week_idx on public.weekly_reports(user_id, week_start desc);

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists notes_updated_at on public.notes;
create trigger notes_updated_at before update on public.notes for each row execute function public.set_updated_at();
drop trigger if exists documents_updated_at on public.documents;
create trigger documents_updated_at before update on public.documents for each row execute function public.set_updated_at();
drop trigger if exists insights_updated_at on public.insights;
create trigger insights_updated_at before update on public.insights for each row execute function public.set_updated_at();
drop trigger if exists weekly_reports_updated_at on public.weekly_reports;
create trigger weekly_reports_updated_at before update on public.weekly_reports for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.notes enable row level security;
alter table public.documents enable row level security;
alter table public.insights enable row level security;
alter table public.weekly_reports enable row level security;

create policy "profiles_select_own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "notes_select_own" on public.notes for select to authenticated using ((select auth.uid()) = user_id);
create policy "notes_insert_own" on public.notes for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "notes_update_own" on public.notes for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "notes_delete_own" on public.notes for delete to authenticated using ((select auth.uid()) = user_id);

create policy "documents_select_own" on public.documents for select to authenticated using ((select auth.uid()) = user_id);
create policy "documents_insert_own" on public.documents for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "documents_update_own" on public.documents for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "documents_delete_own" on public.documents for delete to authenticated using ((select auth.uid()) = user_id);

create policy "insights_select_own" on public.insights for select to authenticated using ((select auth.uid()) = user_id);
create policy "insights_insert_own" on public.insights for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "insights_update_own" on public.insights for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "insights_delete_own" on public.insights for delete to authenticated using ((select auth.uid()) = user_id);

create policy "weekly_reports_select_own" on public.weekly_reports for select to authenticated using ((select auth.uid()) = user_id);
create policy "weekly_reports_insert_own" on public.weekly_reports for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "weekly_reports_update_own" on public.weekly_reports for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "weekly_reports_delete_own" on public.weekly_reports for delete to authenticated using ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'action-documents',
  'action-documents',
  false,
  20971520,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "storage_select_own_documents"
on storage.objects for select to authenticated
using (bucket_id = 'action-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "storage_insert_own_documents"
on storage.objects for insert to authenticated
with check (bucket_id = 'action-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "storage_update_own_documents"
on storage.objects for update to authenticated
using (bucket_id = 'action-documents' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'action-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "storage_delete_own_documents"
on storage.objects for delete to authenticated
using (bucket_id = 'action-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.notes to authenticated;
grant select, insert, update, delete on public.documents to authenticated;
grant select, insert, update, delete on public.insights to authenticated;
grant select, insert, update, delete on public.weekly_reports to authenticated;

do $$
declare
  table_name text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach table_name in array array['notes', 'documents', 'insights', 'weekly_reports'] loop
      if not exists (
        select 1
        from pg_publication_tables
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
