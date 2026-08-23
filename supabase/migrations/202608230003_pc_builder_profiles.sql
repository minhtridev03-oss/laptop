begin;

-- Business-owned recommendation profiles for the PC Builder.
-- The storefront reads these rows and scores live products by budget, stock,
-- performance metadata and compatibility. Admin/server-side writes only.
create table if not exists public.pc_build_profiles (
  id text primary key,
  name text not null,
  description text not null default '',
  use_case text not null,
  target_resolution text,
  budget_min numeric(14, 2) not null check (budget_min > 0),
  budget_max numeric(14, 2) not null check (budget_max >= budget_min),
  default_budget numeric(14, 2) not null check (default_budget > 0),
  component_budget_weights jsonb not null default '{}'::jsonb,
  score_weights jsonb not null default '{}'::jsonb,
  requirements jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pc_build_profiles_default_budget_range
    check (default_budget between budget_min and budget_max),
  constraint pc_build_profiles_component_weights_object
    check (jsonb_typeof(component_budget_weights) = 'object'),
  constraint pc_build_profiles_score_weights_object
    check (jsonb_typeof(score_weights) = 'object'),
  constraint pc_build_profiles_requirements_object
    check (jsonb_typeof(requirements) = 'object')
);

alter table public.pc_build_profiles enable row level security;

drop policy if exists "pc_build_profiles_public_active" on public.pc_build_profiles;
create policy "pc_build_profiles_public_active"
  on public.pc_build_profiles
  for select
  using (is_active = true);

revoke all on public.pc_build_profiles from anon, authenticated;
grant select on public.pc_build_profiles to anon, authenticated;

drop trigger if exists pc_build_profiles_set_updated_at on public.pc_build_profiles;
create trigger pc_build_profiles_set_updated_at
  before update on public.pc_build_profiles
  for each row execute function public.set_updated_at();

insert into public.pc_build_profiles (
  id, name, description, use_case, target_resolution,
  budget_min, budget_max, default_budget,
  component_budget_weights, score_weights, requirements,
  is_active, sort_order
)
values
  (
    'entry', 'Phổ thông', 'Học tập, văn phòng và gaming Full HD', 'office', '1080p',
    15000000, 26000000, 20000000,
    '{"cpu":0.16,"mainboard":0.11,"ram":0.08,"gpu":0.38,"storage":0.06,"psu":0.07,"case":0.08,"cooler":0.06}'::jsonb,
    '{"performance":0.34,"value":0.20,"budget_fit":0.29,"stock":0.07,"tier":0.10}'::jsonb,
    '{"legacy_tier":"entry","min_cpu_score":55,"min_gpu_score":60,"min_ram_gb":16,"min_storage_gb":500}'::jsonb,
    true, 1
  ),
  (
    'balanced', 'Cân bằng', 'Gaming 2K, đồ họa và làm việc đa nhiệm', 'gaming', '1440p',
    28000000, 48000000, 37000000,
    '{"cpu":0.16,"mainboard":0.11,"ram":0.08,"gpu":0.40,"storage":0.06,"psu":0.07,"case":0.07,"cooler":0.05}'::jsonb,
    '{"performance":0.38,"value":0.19,"budget_fit":0.27,"stock":0.06,"tier":0.10}'::jsonb,
    '{"legacy_tier":"balanced","min_cpu_score":75,"min_gpu_score":82,"min_ram_gb":32,"min_storage_gb":1024}'::jsonb,
    true, 2
  ),
  (
    'premium', 'Cao cấp', 'Gaming 4K, render và workstation cá nhân', 'creator', '4K',
    55000000, 110000000, 75000000,
    '{"cpu":0.15,"mainboard":0.12,"ram":0.07,"gpu":0.46,"storage":0.05,"psu":0.06,"case":0.05,"cooler":0.04}'::jsonb,
    '{"performance":0.44,"value":0.14,"budget_fit":0.22,"stock":0.05,"tier":0.15}'::jsonb,
    '{"legacy_tier":"premium","min_cpu_score":90,"min_gpu_score":94,"min_ram_gb":64,"min_storage_gb":2048}'::jsonb,
    true, 3
  )
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  use_case = excluded.use_case,
  target_resolution = excluded.target_resolution,
  budget_min = excluded.budget_min,
  budget_max = excluded.budget_max,
  default_budget = excluded.default_budget,
  component_budget_weights = excluded.component_budget_weights,
  score_weights = excluded.score_weights,
  requirements = excluded.requirements,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order,
  updated_at = now();

-- Demo products remain usable, while real products can be excluded explicitly
-- by setting specifications.builder_enabled to false.
update public.products
set specifications = specifications || '{"builder_enabled":true}'::jsonb
where id like 'build-demo-%'
  and specifications ? 'component_type';

commit;

