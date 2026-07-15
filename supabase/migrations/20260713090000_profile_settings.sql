alter table public.profiles
  add column if not exists avatar_path text,
  add column if not exists preferences jsonb not null default '{"startView":"overview","reduceMotion":false}'::jsonb;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'action-avatars',
  'action-avatars',
  false,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "storage_select_own_avatar"
on storage.objects for select to authenticated
using (bucket_id = 'action-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "storage_insert_own_avatar"
on storage.objects for insert to authenticated
with check (bucket_id = 'action-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "storage_update_own_avatar"
on storage.objects for update to authenticated
using (bucket_id = 'action-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'action-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "storage_delete_own_avatar"
on storage.objects for delete to authenticated
using (bucket_id = 'action-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'profiles'
    )
  then
    alter publication supabase_realtime add table public.profiles;
  end if;
end;
$$;
