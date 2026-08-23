begin;

create table if not exists public.saved_pc_builds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 2 and 120),
  profile_id text references public.pc_build_profiles(id) on delete set null,
  selected_product_ids jsonb not null default '{}'::jsonb,
  total_snapshot numeric(14, 2) not null default 0 check (total_snapshot >= 0),
  is_public boolean not null default false,
  share_token uuid not null default gen_random_uuid() unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(selected_product_ids) = 'object')
);
create index if not exists saved_pc_builds_owner_idx
  on public.saved_pc_builds (user_id, updated_at desc);

alter table public.saved_pc_builds enable row level security;
drop policy if exists "saved_pc_builds_owner_read" on public.saved_pc_builds;
create policy "saved_pc_builds_owner_read" on public.saved_pc_builds for select to authenticated
using (user_id = auth.uid());
drop policy if exists "saved_pc_builds_owner_insert" on public.saved_pc_builds;
create policy "saved_pc_builds_owner_insert" on public.saved_pc_builds for insert to authenticated
with check (user_id = auth.uid());
drop policy if exists "saved_pc_builds_owner_update" on public.saved_pc_builds;
create policy "saved_pc_builds_owner_update" on public.saved_pc_builds for update to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "saved_pc_builds_owner_delete" on public.saved_pc_builds;
create policy "saved_pc_builds_owner_delete" on public.saved_pc_builds for delete to authenticated
using (user_id = auth.uid());

revoke all on public.saved_pc_builds from anon, authenticated;
grant select, insert, update, delete on public.saved_pc_builds to authenticated;

drop trigger if exists saved_pc_builds_set_updated_at on public.saved_pc_builds;
create trigger saved_pc_builds_set_updated_at before update on public.saved_pc_builds
for each row execute function public.set_updated_at();

create or replace function public.get_shared_pc_build(p_share_token uuid)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'id', b.id,
    'name', b.name,
    'profile_id', b.profile_id,
    'selected_product_ids', b.selected_product_ids,
    'total_snapshot', b.total_snapshot,
    'updated_at', b.updated_at
  )
  from public.saved_pc_builds b
  where b.share_token = p_share_token and b.is_public = true;
$$;
revoke all on function public.get_shared_pc_build(uuid) from public;
grant execute on function public.get_shared_pc_build(uuid) to anon, authenticated;

commit;
