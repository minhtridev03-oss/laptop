create or replace function public.admin_upsert_banner(p_banner jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id text := nullif(p_banner->>'id', '');
begin
  if not public.is_staff() then raise exception 'FORBIDDEN'; end if;
  if v_id is null then v_id := gen_random_uuid()::text; end if;
  insert into public.banners (
    id, type, title1, title2, description, link_url, button_text, 
    image_url, tag, hidden_on_mobile, sort_order
  ) values (
    v_id, p_banner->>'type', p_banner->>'title1', p_banner->>'title2', 
    nullif(p_banner->>'description', ''), nullif(p_banner->>'link_url', ''), 
    nullif(p_banner->>'button_text', ''), p_banner->>'image_url', 
    nullif(p_banner->>'tag', ''), coalesce((p_banner->>'hidden_on_mobile')::boolean, false), 
    coalesce((p_banner->>'sort_order')::integer, 0)
  )
  on conflict (id) do update set
    type = excluded.type,
    title1 = excluded.title1,
    title2 = excluded.title2,
    description = excluded.description,
    link_url = excluded.link_url,
    button_text = excluded.button_text,
    image_url = excluded.image_url,
    tag = excluded.tag,
    hidden_on_mobile = excluded.hidden_on_mobile,
    sort_order = excluded.sort_order;
  
  return jsonb_build_object('success', true, 'id', v_id);
end;
$$;

create or replace function public.admin_delete_banner(p_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_staff() then raise exception 'FORBIDDEN'; end if;
  delete from public.banners where id = p_id;
  return jsonb_build_object('success', true);
end;
$$;

create or replace function public.admin_upsert_category(p_category jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id text := nullif(p_category->>'id', '');
begin
  if not public.is_staff() then raise exception 'FORBIDDEN'; end if;
  if v_id is null then v_id := gen_random_uuid()::text; end if;
  insert into public.categories (
    id, name, icon, slug, sort_order
  ) values (
    v_id, p_category->>'name', p_category->>'icon', p_category->>'slug', coalesce((p_category->>'sort_order')::integer, 0)
  )
  on conflict (id) do update set
    name = excluded.name,
    icon = excluded.icon,
    slug = excluded.slug,
    sort_order = excluded.sort_order;
    
  return jsonb_build_object('success', true, 'id', v_id);
end;
$$;

create or replace function public.admin_delete_category(p_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_staff() then raise exception 'FORBIDDEN'; end if;
  delete from public.categories where id = p_id;
  return jsonb_build_object('success', true);
end;
$$;

revoke all on function public.admin_upsert_banner(jsonb) from public;
grant execute on function public.admin_upsert_banner(jsonb) to authenticated;
revoke all on function public.admin_delete_banner(text) from public;
grant execute on function public.admin_delete_banner(text) to authenticated;
revoke all on function public.admin_upsert_category(jsonb) from public;
grant execute on function public.admin_upsert_category(jsonb) to authenticated;
revoke all on function public.admin_delete_category(text) from public;
grant execute on function public.admin_delete_category(text) to authenticated;
