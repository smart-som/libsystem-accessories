create extension if not exists "pgcrypto";

create type public.user_role as enum ('customer', 'staff', 'admin');
create type public.product_status as enum ('active', 'archived', 'draft');
create type public.order_status as enum (
  'pending',
  'paid',
  'processing',
  'ready_for_pickup',
  'shipped',
  'delivered',
  'cancelled'
);
create type public.fulfillment_method as enum ('delivery', 'pickup');
create type public.payment_method as enum ('card', 'bank_transfer', 'cash', 'pos');
create type public.inventory_reason as enum ('online_order', 'walk_in_sale', 'restock', 'adjustment');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  phone text,
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  hero text,
  created_at timestamptz not null default now()
);

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id),
  brand_id uuid references public.brands(id),
  name text not null,
  slug text not null unique,
  short_description text,
  description text,
  base_price numeric(12,2) not null default 0,
  cost_price numeric(12,2) not null default 0,
  featured boolean not null default false,
  status public.product_status not null default 'draft',
  compatibility text[] not null default '{}',
  tags text[] not null default '{}',
  seo_title text,
  seo_description text,
  rating numeric(3,2) not null default 0,
  review_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null unique,
  name text not null,
  attributes jsonb not null default '{}'::jsonb,
  stock_quantity integer not null default 0,
  price numeric(12,2) not null default 0,
  cost_price numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text,
  public_url text,
  alt_text text,
  position integer not null default 0
);

create table if not exists public.shipping_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  regions text[] not null default '{}',
  fee numeric(12,2) not null default 0,
  eta text
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid references public.profiles(id),
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  status public.order_status not null default 'pending',
  payment_method public.payment_method not null,
  payment_reference text,
  fulfillment_method public.fulfillment_method not null,
  shipping_zone_id uuid references public.shipping_zones(id),
  shipping_address text,
  subtotal numeric(12,2) not null default 0,
  shipping_fee numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  placed_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id),
  variant_id uuid references public.product_variants(id),
  product_name text not null,
  variant_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null default 0,
  unit_cost numeric(12,2) not null default 0,
  image_url text
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null default 'paystack',
  provider_reference text not null,
  amount numeric(12,2) not null,
  status text not null default 'pending',
  paid_at timestamptz
);

create table if not exists public.walkin_sales (
  id uuid primary key default gen_random_uuid(),
  receipt_number text not null unique,
  recorded_by uuid not null references public.profiles(id),
  customer_name text,
  customer_phone text,
  payment_method public.payment_method not null,
  subtotal numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  sold_at timestamptz not null default now()
);

create table if not exists public.walkin_sale_items (
  id uuid primary key default gen_random_uuid(),
  walkin_sale_id uuid not null references public.walkin_sales(id) on delete cascade,
  product_id uuid references public.products(id),
  variant_id uuid references public.product_variants(id),
  product_name text not null,
  variant_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null default 0,
  unit_cost numeric(12,2) not null default 0
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id),
  variant_id uuid not null references public.product_variants(id),
  quantity_change integer not null,
  reason public.inventory_reason not null,
  reference_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_brand on public.products(brand_id);
create index if not exists idx_variants_product on public.product_variants(product_id);
create index if not exists idx_orders_customer on public.orders(customer_id);
create index if not exists idx_walkin_sales_recorded_by on public.walkin_sales(recorded_by);
create index if not exists idx_inventory_variant on public.inventory_movements(variant_id);

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.walkin_sales enable row level security;
alter table public.walkin_sale_items enable row level security;
alter table public.inventory_movements enable row level security;

create policy "Customers can read active products"
on public.products
for select
using (status = 'active');

create policy "Customers can read active variants"
on public.product_variants
for select
using (
  exists (
    select 1
    from public.products
    where public.products.id = public.product_variants.product_id
      and public.products.status = 'active'
  )
);

create policy "Admins and staff manage operational data"
on public.walkin_sales
for all
using (
  exists (
    select 1
    from public.profiles
    where public.profiles.id = auth.uid()
      and public.profiles.role in ('admin', 'staff')
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where public.profiles.id = auth.uid()
      and public.profiles.role in ('admin', 'staff')
  )
);

create policy "Admins manage products"
on public.products
for all
using (
  exists (
    select 1
    from public.profiles
    where public.profiles.id = auth.uid()
      and public.profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where public.profiles.id = auth.uid()
      and public.profiles.role = 'admin'
  )
);
