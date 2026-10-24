-- ============================================================================
--  L MART ONLINE · Supabase schema
--  Run this file in Supabase → SQL Editor (or `supabase db push`).
--  Safe to re-run: all objects are created with IF NOT EXISTS / OR REPLACE.
-- ============================================================================

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------------
--  Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
--  profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  full_name   text,
  phone       text,
  role        text not null default 'customer' check (role in ('customer', 'admin')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles (role);

-- A single source of truth for "is this user the shop admin?".
-- SECURITY DEFINER so RLS policies can call it without recursive lookups.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- Create a profile automatically for every new auth user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(coalesce(new.email, 'friend'), '@', 1)),
    nullif(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for accounts created before this migration.
insert into public.profiles (id, email, full_name)
select u.id, u.email,
       coalesce(nullif(u.raw_user_meta_data ->> 'full_name', ''), split_part(coalesce(u.email, 'friend'), '@', 1))
from auth.users u
on conflict (id) do nothing;

-- Customers may edit their own profile but never promote themselves.
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    new.role := old.role;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists guard_profile_role on public.profiles;
create trigger guard_profile_role
  before update on public.profiles
  for each row execute function public.guard_profile_role();

-- ---------------------------------------------------------------------------
--  categories
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  emoji       text,
  image_url   text,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists categories_active_idx on public.categories (is_active, sort_order);

-- ---------------------------------------------------------------------------
--  products
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories (id) on delete set null,
  name        text not null,
  slug        text not null unique,
  description text,
  price       numeric(10, 2) not null check (price >= 0),
  mrp         numeric(10, 2) check (mrp is null or mrp >= 0),
  unit        text not null default '1 pc',
  image_url   text,
  stock       integer not null default 0 check (stock >= 0),
  is_active   boolean not null default true,
  is_featured boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_active_idx on public.products (is_active, created_at desc);
create index if not exists products_featured_idx on public.products (is_featured) where is_featured;
create index if not exists products_name_trgm_idx on public.products using gin (name gin_trgm_ops);

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
--  banners
-- ---------------------------------------------------------------------------
create table if not exists public.banners (
  id          uuid primary key default gen_random_uuid(),
  eyebrow     text,
  title       text not null,
  subtitle    text,
  image_url   text,
  cta_label   text default 'Shop now',
  cta_link    text default '/shop',
  tone        text not null default 'forest' check (tone in ('forest', 'cream', 'gold', 'ink')),
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists banners_active_idx on public.banners (is_active, sort_order);

-- ---------------------------------------------------------------------------
--  coupons
-- ---------------------------------------------------------------------------
create table if not exists public.coupons (
  id             uuid primary key default gen_random_uuid(),
  code           text not null unique,
  description    text,
  discount_type  text not null default 'percent' check (discount_type in ('percent', 'flat')),
  discount_value numeric(10, 2) not null check (discount_value >= 0),
  min_order      numeric(10, 2) not null default 0,
  max_discount   numeric(10, 2),
  usage_limit    integer,
  used_count     integer not null default 0,
  starts_at      timestamptz,
  expires_at     timestamptz,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);

create index if not exists coupons_code_idx on public.coupons (upper(code));

-- ---------------------------------------------------------------------------
--  orders / order_items
-- ---------------------------------------------------------------------------
create sequence if not exists public.order_number_seq start 1001;

create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  order_number     text not null unique,
  user_id          uuid not null references auth.users (id) on delete cascade,
  status           text not null default 'placed'
                   check (status in ('placed', 'packed', 'out_for_delivery', 'delivered', 'cancelled')),
  payment_method   text not null default 'cod' check (payment_method = 'cod'),
  subtotal         numeric(10, 2) not null default 0,
  discount         numeric(10, 2) not null default 0,
  delivery_fee     numeric(10, 2) not null default 0,
  total            numeric(10, 2) not null default 0,
  coupon_code      text,
  customer_name    text not null,
  phone            text not null,
  address          text not null,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists orders_user_idx on public.orders (user_id, created_at desc);
create index if not exists orders_status_idx on public.orders (status, created_at desc);

drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create table if not exists public.order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders (id) on delete cascade,
  product_id  uuid references public.products (id) on delete set null,
  name        text not null,
  unit        text,
  price       numeric(10, 2) not null,
  quantity    integer not null check (quantity > 0),
  image_url   text
);

create index if not exists order_items_order_idx on public.order_items (order_id);

-- ---------------------------------------------------------------------------
--  store settings (singleton row)
-- ---------------------------------------------------------------------------
create table if not exists public.store_settings (
  id                  smallint primary key default 1 check (id = 1),
  store_name          text not null default 'L MART ONLINE',
  tagline             text default 'Everyday essentials from your neighbourhood store.',
  announcement        text,
  is_open             boolean not null default true,
  phone               text,
  address             text,
  delivery_fee        numeric(10, 2) not null default 25,
  free_delivery_above numeric(10, 2) not null default 499,
  min_order           numeric(10, 2) not null default 99,
  delivery_estimate   text default 'Same-day delivery, 9 AM – 9 PM',
  updated_at          timestamptz not null default now()
);

insert into public.store_settings (id) values (1)
on conflict (id) do nothing;

drop trigger if exists store_settings_updated_at on public.store_settings;
create trigger store_settings_updated_at
  before update on public.store_settings
  for each row execute function public.set_updated_at();

-- ===========================================================================
--  Row Level Security
-- ===========================================================================
alter table public.profiles       enable row level security;
alter table public.categories     enable row level security;
alter table public.products       enable row level security;
alter table public.banners        enable row level security;
alter table public.coupons        enable row level security;
alter table public.orders         enable row level security;
alter table public.order_items    enable row level security;
alter table public.store_settings enable row level security;

-- profiles ------------------------------------------------------------------
drop policy if exists "profiles: read own or admin" on public.profiles;
create policy "profiles: read own or admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles: admin manage" on public.profiles;
create policy "profiles: admin manage" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- categories ----------------------------------------------------------------
drop policy if exists "categories: public read" on public.categories;
create policy "categories: public read" on public.categories
  for select using (is_active or public.is_admin());

drop policy if exists "categories: admin write" on public.categories;
create policy "categories: admin write" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

-- products ------------------------------------------------------------------
drop policy if exists "products: public read" on public.products;
create policy "products: public read" on public.products
  for select using (is_active or public.is_admin());

drop policy if exists "products: admin write" on public.products;
create policy "products: admin write" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- banners -------------------------------------------------------------------
drop policy if exists "banners: public read" on public.banners;
create policy "banners: public read" on public.banners
  for select using (is_active or public.is_admin());

drop policy if exists "banners: admin write" on public.banners;
create policy "banners: admin write" on public.banners
  for all using (public.is_admin()) with check (public.is_admin());

-- coupons -------------------------------------------------------------------
-- Live coupons double as the public "offers" feed, so active ones are readable.
drop policy if exists "coupons: public read active" on public.coupons;
create policy "coupons: public read active" on public.coupons
  for select using (is_active or public.is_admin());

drop policy if exists "coupons: admin write" on public.coupons;
create policy "coupons: admin write" on public.coupons
  for all using (public.is_admin()) with check (public.is_admin());

-- orders --------------------------------------------------------------------
drop policy if exists "orders: read own or admin" on public.orders;
create policy "orders: read own or admin" on public.orders
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "orders: admin update" on public.orders;
create policy "orders: admin update" on public.orders
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "orders: admin delete" on public.orders;
create policy "orders: admin delete" on public.orders
  for delete using (public.is_admin());

-- Insert happens exclusively through public.place_order().

drop policy if exists "order_items: read own or admin" on public.order_items;
create policy "order_items: read own or admin" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (o.user_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists "order_items: admin write" on public.order_items;
create policy "order_items: admin write" on public.order_items
  for all using (public.is_admin()) with check (public.is_admin());

-- store settings ------------------------------------------------------------
drop policy if exists "settings: public read" on public.store_settings;
create policy "settings: public read" on public.store_settings
  for select using (true);

drop policy if exists "settings: admin update" on public.store_settings;
create policy "settings: admin update" on public.store_settings
  for update using (public.is_admin()) with check (public.is_admin());

-- ===========================================================================
--  Grants for the Supabase API roles
-- ===========================================================================
grant usage on schema public to anon, authenticated;
grant select on public.categories, public.products, public.banners, public.coupons, public.store_settings to anon, authenticated;
grant select on public.profiles, public.orders, public.order_items to authenticated;
grant update on public.profiles to authenticated;
grant insert, update, delete on public.categories, public.products, public.banners, public.coupons to authenticated;
grant update, delete on public.orders to authenticated;
grant insert, update, delete on public.order_items to authenticated;
grant update on public.store_settings to authenticated;
grant usage, select on sequence public.order_number_seq to authenticated;

-- ===========================================================================
--  Coupon validation (read-only, safe to expose)
-- ===========================================================================
create or replace function public.validate_coupon(p_code text, p_subtotal numeric)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_coupon public.coupons;
  v_discount numeric(10, 2) := 0;
begin
  select * into v_coupon
  from public.coupons
  where upper(code) = upper(trim(p_code)) and is_active
  limit 1;

  if not found then
    return jsonb_build_object('valid', false, 'discount', 0, 'message', 'That coupon code is not valid.');
  end if;
  if v_coupon.starts_at is not null and v_coupon.starts_at > now() then
    return jsonb_build_object('valid', false, 'discount', 0, 'message', 'This coupon is not active yet.');
  end if;
  if v_coupon.expires_at is not null and v_coupon.expires_at < now() then
    return jsonb_build_object('valid', false, 'discount', 0, 'message', 'This coupon has expired.');
  end if;
  if v_coupon.usage_limit is not null and v_coupon.used_count >= v_coupon.usage_limit then
    return jsonb_build_object('valid', false, 'discount', 0, 'message', 'This coupon has been fully redeemed.');
  end if;
  if p_subtotal < v_coupon.min_order then
    return jsonb_build_object(
      'valid', false,
      'discount', 0,
      'message', format('Add items worth ₹%s more to unlock this coupon.', to_char(v_coupon.min_order - p_subtotal, 'FM999999990.00'))
    );
  end if;

  if v_coupon.discount_type = 'percent' then
    v_discount := round(p_subtotal * v_coupon.discount_value / 100, 2);
    if v_coupon.max_discount is not null then
      v_discount := least(v_discount, v_coupon.max_discount);
    end if;
  else
    v_discount := v_coupon.discount_value;
  end if;
  v_discount := least(v_discount, p_subtotal);

  return jsonb_build_object(
    'valid', true,
    'code', v_coupon.code,
    'discount', v_discount,
    'description', v_coupon.description,
    'message', coalesce(v_coupon.description, 'Coupon applied.')
  );
end;
$$;

revoke all on function public.validate_coupon(text, numeric) from public;
grant execute on function public.validate_coupon(text, numeric) to anon, authenticated;

-- ===========================================================================
--  Place order (prices, stock, coupons and totals are computed server-side)
-- ===========================================================================
create or replace function public.place_order(
  p_items         jsonb,
  p_customer_name text,
  p_phone         text,
  p_address       text,
  p_notes         text default null,
  p_coupon        text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid       uuid := auth.uid();
  v_settings  public.store_settings;
  v_product   public.products;
  v_coupon    public.coupons;
  v_coupon_code text := null;
  v_item      jsonb;
  v_qty       integer;
  v_subtotal  numeric(10, 2) := 0;
  v_discount  numeric(10, 2) := 0;
  v_delivery  numeric(10, 2) := 0;
  v_total     numeric(10, 2) := 0;
  v_items     jsonb := '[]'::jsonb;
  v_order_id  uuid;
  v_number    text;
begin
  if v_uid is null then
    raise exception 'Please sign in to place an order.' using errcode = 'P0001';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Your cart is empty.' using errcode = 'P0001';
  end if;
  if coalesce(trim(p_customer_name), '') = ''
     or coalesce(trim(p_phone), '') = ''
     or coalesce(trim(p_address), '') = '' then
    raise exception 'Name, phone number and delivery address are required.' using errcode = 'P0001';
  end if;

  select * into v_settings from public.store_settings where id = 1;
  if not found then
    raise exception 'The store is not configured yet.' using errcode = 'P0001';
  end if;
  if not v_settings.is_open then
    raise exception 'The store is currently closed. Please try again later.' using errcode = 'P0001';
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := greatest(coalesce((v_item ->> 'quantity')::int, 1), 1);
    if v_qty > 50 then
      raise exception 'Maximum quantity per item is 50.' using errcode = 'P0001';
    end if;

    select * into v_product
    from public.products
    where id = (v_item ->> 'product_id')::uuid and is_active
    for update;

    if not found then
      raise exception 'One of the items in your cart is no longer available.' using errcode = 'P0001';
    end if;
    if v_product.stock < v_qty then
      raise exception '% is out of stock.', v_product.name using errcode = 'P0001';
    end if;

    v_subtotal := v_subtotal + (v_product.price * v_qty);
    v_items := v_items || jsonb_build_array(jsonb_build_object(
      'product_id', v_product.id,
      'name', v_product.name,
      'unit', v_product.unit,
      'price', v_product.price,
      'quantity', v_qty,
      'image_url', v_product.image_url
    ));
  end loop;

  if v_subtotal < coalesce(v_settings.min_order, 0) then
    raise exception 'Minimum order value is ₹%.', to_char(v_settings.min_order, 'FM999999990') using errcode = 'P0001';
  end if;

  v_delivery := case
    when v_subtotal >= coalesce(v_settings.free_delivery_above, 0) then 0
    else coalesce(v_settings.delivery_fee, 0)
  end;

  if p_coupon is not null and trim(p_coupon) <> '' then
    select * into v_coupon
    from public.coupons
    where upper(code) = upper(trim(p_coupon)) and is_active
    limit 1;

    if not found then
      raise exception 'Invalid coupon code.' using errcode = 'P0001';
    end if;
    if v_coupon.starts_at is not null and v_coupon.starts_at > now() then
      raise exception 'This coupon is not active yet.' using errcode = 'P0001';
    end if;
    if v_coupon.expires_at is not null and v_coupon.expires_at < now() then
      raise exception 'This coupon has expired.' using errcode = 'P0001';
    end if;
    if v_coupon.usage_limit is not null and v_coupon.used_count >= v_coupon.usage_limit then
      raise exception 'This coupon is no longer available.' using errcode = 'P0001';
    end if;
    if v_subtotal < v_coupon.min_order then
      raise exception 'This coupon needs a minimum order of ₹%.', to_char(v_coupon.min_order, 'FM999999990') using errcode = 'P0001';
    end if;

    if v_coupon.discount_type = 'percent' then
      v_discount := round(v_subtotal * v_coupon.discount_value / 100, 2);
      if v_coupon.max_discount is not null then
        v_discount := least(v_discount, v_coupon.max_discount);
      end if;
    else
      v_discount := v_coupon.discount_value;
    end if;
    v_discount := least(v_discount, v_subtotal);
    v_coupon_code := v_coupon.code;
  end if;

  v_total := greatest(v_subtotal - v_discount + v_delivery, 0);
  v_number := 'LMO-' || to_char(now(), 'YYMMDD') || '-' ||
              lpad(nextval('public.order_number_seq')::text, 4, '0');

  insert into public.orders (
    order_number, user_id, status, payment_method,
    subtotal, discount, delivery_fee, total, coupon_code,
    customer_name, phone, address, notes
  ) values (
    v_number, v_uid, 'placed', 'cod',
    v_subtotal, v_discount, v_delivery, v_total, v_coupon_code,
    trim(p_customer_name), trim(p_phone), trim(p_address), nullif(trim(coalesce(p_notes, '')), '')
  )
  returning id into v_order_id;

  insert into public.order_items (order_id, product_id, name, unit, price, quantity, image_url)
  select v_order_id, x.product_id, x.name, x.unit, x.price, x.quantity, x.image_url
  from jsonb_to_recordset(v_items) as x(
    product_id uuid, name text, unit text, price numeric, quantity integer, image_url text
  );

  update public.products p
  set stock = greatest(p.stock - x.quantity, 0)
  from jsonb_to_recordset(v_items) as x(product_id uuid, quantity integer)
  where p.id = x.product_id;

  if v_coupon_code is not null then
    update public.coupons set used_count = used_count + 1 where upper(code) = upper(v_coupon_code);
  end if;

  return jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_number,
    'subtotal', v_subtotal,
    'discount', v_discount,
    'delivery_fee', v_delivery,
    'total', v_total,
    'coupon_code', v_coupon_code
  );
end;
$$;

revoke all on function public.place_order(jsonb, text, text, text, text, text) from public;
grant execute on function public.place_order(jsonb, text, text, text, text, text) to authenticated;

-- ===========================================================================
--  Storage: public product images, admin-only writes
-- ===========================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images', 'product-images', true, 5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif']
)
on conflict (id) do update
  set public = true,
      file_size_limit = 5242880,
      allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'];

drop policy if exists "product images: public read" on storage.objects;
create policy "product images: public read" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "product images: admin insert" on storage.objects;
create policy "product images: admin insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "product images: admin update" on storage.objects;
create policy "product images: admin update" on storage.objects
  for update to authenticated using (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "product images: admin delete" on storage.objects;
create policy "product images: admin delete" on storage.objects
  for delete to authenticated using (bucket_id = 'product-images' and public.is_admin());

-- ===========================================================================
--  Promote your first admin (run once, after signing up in the app):
--
--    update public.profiles set role = 'admin' where email = 'you@example.com';
--
-- ===========================================================================
