create extension if not exists pgcrypto;

create type public.app_role as enum ('customer', 'admin');
create type public.inventory_movement_type as enum ('initial', 'purchase', 'sale', 'adjustment', 'return');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.app_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text,
  image_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_name_unique unique (name),
  constraint categories_slug_unique unique (slug),
  constraint categories_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  logo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brands_name_unique unique (name),
  constraint brands_slug_unique unique (slug),
  constraint brands_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null,
  slug text not null,
  model text,
  description text not null default '',
  category_id uuid not null references public.categories(id) on delete restrict,
  brand_id uuid not null references public.brands(id) on delete restrict,
  price numeric(14,2) not null check (price >= 0),
  sale_price numeric(14,2) check (sale_price is null or sale_price >= 0),
  stock integer not null default 0 check (stock >= 0),
  minimum_stock integer not null default 3 check (minimum_stock >= 0),
  is_active boolean not null default true,
  is_featured boolean not null default false,
  is_new boolean not null default false,
  is_on_sale boolean not null default false,
  sale_starts_at timestamptz,
  sale_ends_at timestamptz,
  warranty text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_code_unique unique (code),
  constraint products_slug_unique unique (slug),
  constraint products_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint products_sale_price_valid check (sale_price is null or sale_price <= price),
  constraint products_sale_dates_valid check (sale_ends_at is null or sale_starts_at is null or sale_ends_at > sale_starts_at)
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  public_url text not null,
  alt_text text,
  sort_order integer not null default 0 check (sort_order >= 0),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  constraint product_images_product_path_unique unique (product_id, storage_path)
);

create unique index product_images_one_primary_idx
  on public.product_images(product_id) where is_primary;

create table public.product_specs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  value text not null,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  constraint product_specs_product_name_unique unique (product_id, name)
);

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete restrict,
  movement_type public.inventory_movement_type not null,
  quantity integer not null check (quantity <> 0),
  stock_before integer not null check (stock_before >= 0),
  stock_after integer not null check (stock_after >= 0),
  note text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.store_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text not null unique,
  setting_value jsonb not null default '{}'::jsonb,
  is_public boolean not null default false,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_category_idx on public.products(category_id);
create index products_brand_idx on public.products(brand_id);
create index products_active_created_idx on public.products(is_active, created_at desc);
create index products_flags_idx on public.products(is_featured, is_new, is_on_sale);
create index products_price_idx on public.products(price);
create index products_stock_idx on public.products(stock);
create index product_images_product_order_idx on public.product_images(product_id, sort_order);
create index product_specs_product_order_idx on public.product_specs(product_id, sort_order);
create index inventory_movements_product_created_idx on public.inventory_movements(product_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger categories_set_updated_at before update on public.categories
for each row execute function public.set_updated_at();
create trigger brands_set_updated_at before update on public.brands
for each row execute function public.set_updated_at();
create trigger products_set_updated_at before update on public.products
for each row execute function public.set_updated_at();
create trigger store_settings_set_updated_at before update on public.store_settings
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), 'customer')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.record_stock_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.stock is distinct from new.stock then
    insert into public.inventory_movements (
      product_id, movement_type, quantity, stock_before, stock_after, note, created_by
    ) values (
      new.id, 'adjustment', new.stock - old.stock, old.stock, new.stock,
      'Actualización desde el panel administrativo', auth.uid()
    );
  end if;
  return new;
end;
$$;

create trigger products_record_stock_change
after update of stock on public.products
for each row execute function public.record_stock_change();

create or replace function public.duplicate_product(source_product_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  source_product public.products%rowtype;
  new_product_id uuid := gen_random_uuid();
  unique_suffix text := lower(substr(replace(new_product_id::text, '-', ''), 1, 8));
begin
  if not public.is_admin() then
    raise exception 'Acceso denegado';
  end if;

  select * into source_product from public.products where id = source_product_id;
  if not found then
    raise exception 'Producto no encontrado';
  end if;

  insert into public.products (
    id, name, code, slug, model, description, category_id, brand_id, price,
    sale_price, stock, minimum_stock, is_active, is_featured, is_new,
    is_on_sale, sale_starts_at, sale_ends_at, warranty
  ) values (
    new_product_id, source_product.name || ' (copia)', source_product.code || '-' || unique_suffix,
    source_product.slug || '-copia-' || unique_suffix, source_product.model,
    source_product.description, source_product.category_id, source_product.brand_id,
    source_product.price, source_product.sale_price, source_product.stock,
    source_product.minimum_stock, false, false, false, source_product.is_on_sale,
    source_product.sale_starts_at, source_product.sale_ends_at, source_product.warranty
  );

  insert into public.product_specs (product_id, name, value, sort_order)
  select new_product_id, name, value, sort_order
  from public.product_specs where product_id = source_product_id;

  insert into public.product_images (product_id, storage_path, public_url, alt_text, sort_order, is_primary)
  select new_product_id, storage_path || '?copy=' || unique_suffix, public_url, alt_text, sort_order, is_primary
  from public.product_images where product_id = source_product_id;

  return new_product_id;
end;
$$;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_specs enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.store_settings enable row level security;

create policy "profiles_read_own_or_admin" on public.profiles
for select using (id = auth.uid() or public.is_admin());
create policy "profiles_admin_update" on public.profiles
for update using (public.is_admin()) with check (public.is_admin());

create policy "categories_public_read_active" on public.categories
for select using (is_active or public.is_admin());
create policy "categories_admin_all" on public.categories
for all using (public.is_admin()) with check (public.is_admin());

create policy "brands_public_read_active" on public.brands
for select using (is_active or public.is_admin());
create policy "brands_admin_all" on public.brands
for all using (public.is_admin()) with check (public.is_admin());

create policy "products_public_read_active" on public.products
for select using (is_active or public.is_admin());
create policy "products_admin_all" on public.products
for all using (public.is_admin()) with check (public.is_admin());

create policy "product_images_public_read_active" on public.product_images
for select using (
  exists (select 1 from public.products p where p.id = product_id and p.is_active)
  or public.is_admin()
);
create policy "product_images_admin_all" on public.product_images
for all using (public.is_admin()) with check (public.is_admin());

create policy "product_specs_public_read_active" on public.product_specs
for select using (
  exists (select 1 from public.products p where p.id = product_id and p.is_active)
  or public.is_admin()
);
create policy "product_specs_admin_all" on public.product_specs
for all using (public.is_admin()) with check (public.is_admin());

create policy "inventory_movements_admin_all" on public.inventory_movements
for all using (public.is_admin()) with check (public.is_admin());

create policy "store_settings_public_read" on public.store_settings
for select using (is_public or public.is_admin());
create policy "store_settings_admin_all" on public.store_settings
for all using (public.is_admin()) with check (public.is_admin());

revoke all on function public.duplicate_product(uuid) from public;
grant execute on function public.duplicate_product(uuid) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images', 'product-images', true, 2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "product_images_storage_public_read" on storage.objects
for select using (bucket_id = 'product-images');
create policy "product_images_storage_admin_insert" on storage.objects
for insert to authenticated with check (bucket_id = 'product-images' and public.is_admin());
create policy "product_images_storage_admin_update" on storage.objects
for update to authenticated using (bucket_id = 'product-images' and public.is_admin())
with check (bucket_id = 'product-images' and public.is_admin());
create policy "product_images_storage_admin_delete" on storage.objects
for delete to authenticated using (bucket_id = 'product-images' and public.is_admin());

insert into public.store_settings (setting_key, setting_value, is_public)
values
  ('store_contact', '{"whatsapp":"595985993848","country":"Paraguay"}'::jsonb, true),
  ('inventory', '{"default_minimum_stock":3}'::jsonb, false)
on conflict (setting_key) do update set
  setting_value = excluded.setting_value,
  is_public = excluded.is_public;
