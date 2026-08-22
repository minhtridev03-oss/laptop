begin;

-- A product can belong to more than one menu series (for example Dell 15 and Dell Inspiron).
create table if not exists public.product_category_items (
  product_id text not null references public.products(id) on delete cascade,
  category_item_id uuid not null references public.category_items(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (product_id, category_item_id)
);

create index if not exists product_category_items_category_item_idx
  on public.product_category_items (category_item_id, product_id);

alter table public.product_category_items enable row level security;

drop policy if exists "product_category_items_public_read" on public.product_category_items;
create policy "product_category_items_public_read"
  on public.product_category_items
  for select
  using (true);

grant select on public.product_category_items to anon, authenticated;
revoke insert, update, delete on public.product_category_items from anon, authenticated;

-- Store canonical links in data: the route keeps the parent category and adds a series filter.
update public.category_items as item
set link_url = '/category/' || category_group.category_id || '?series=' || item.id::text
from public.category_groups as category_group
where category_group.id = item.group_id
  and item.link_url is distinct from '/category/' || category_group.category_id || '?series=' || item.id::text;

-- Seed links for products that already exist. Add future products to this table in the same way.
with seed(product_id, category_id, item_name) as (
  values
    ('dell-xps-13', 'laptop-van-phong', 'Dell XPS Series'),
    ('dell-inspiron-15', 'laptop-van-phong', 'Dell 15 Series'),
    ('dell-inspiron-15', 'laptop-van-phong', 'Dell Inspiron Series'),
    ('asus-vivobook-15', 'laptop-van-phong', 'Asus Vivobook S, K'),
    ('lenovo-thinkpad-x1', 'laptop-van-phong', 'Lenovo Thinkpad X'),
    ('asus-tuf-f15', 'laptop-gaming', 'Asus TUF Gaming'),
    ('asus-rog-strix-g16', 'laptop-gaming', 'Asus ROG Strix'),
    ('lenovo-loq-15irh8', 'laptop-gaming', 'Lenovo LOQ Series'),
    ('msi-katana-gf66', 'laptop-gaming', 'MSI GP/GL Series'),
    ('hp-victus-16', 'laptop-gaming', 'HP Victus Series'),
    ('acer-nitro-5', 'laptop-gaming', 'Acer Nitro Series'),
    ('dell-g16-7630', 'laptop-gaming', 'Dell G16 Series')
)
insert into public.product_category_items (product_id, category_item_id)
select seed.product_id, item.id
from seed
join public.products as product on product.id = seed.product_id
join public.category_groups as category_group on category_group.category_id = seed.category_id
join public.category_items as item
  on item.group_id = category_group.id
 and item.name = seed.item_name
on conflict (product_id, category_item_id) do nothing;

commit;
