-- ============================================================================
--  L MART ONLINE · theme presets + delivery area + delivery time options
--  Run in Supabase → SQL Editor (or `supabase db push`).
--  Safe to re-run: columns only appear once, defaults are never reset.
--
--  What this adds:
--    1. store_settings.theme_mode         light | dark | system (store default)
--    2. store_settings.theme_preset       festival/branding accent preset
--    3. store_settings.serviceable_pincodes  admin-controlled delivery area
--                                           (defaults to 312601 · Nimbahera)
--    4. store_settings.delivery_options   delivery time choices shown at
--                                         checkout (instant / 1–2 h / slots)
--    5. orders.delivery_slot              the slot the customer picked
--    6. place_order()                     validates the PIN code + chosen slot
-- ============================================================================

-- ---------------------------------------------------------------------------
--  1. Store settings columns
-- ---------------------------------------------------------------------------
alter table public.store_settings
  add column if not exists theme_mode text not null default 'light',
  add column if not exists theme_preset text not null default 'default',
  add column if not exists serviceable_pincodes text not null default '312601',
  add column if not exists delivery_options jsonb not null default '[
    "Instant · within 30 minutes",
    "Within 1–2 hours",
    "9:00 AM – 11:00 AM",
    "11:00 AM – 1:00 PM",
    "1:00 PM – 3:00 PM",
    "3:00 PM – 5:00 PM",
    "5:00 PM – 7:00 PM",
    "7:00 PM – 9:00 PM"
  ]'::jsonb;

do $$
begin
  alter table public.store_settings
    drop constraint if exists store_settings_theme_mode_check;
  alter table public.store_settings
    add constraint store_settings_theme_mode_check
    check (theme_mode in ('light', 'dark', 'system'));
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
--  2. Orders remember the chosen delivery time
-- ---------------------------------------------------------------------------
alter table public.orders
  add column if not exists delivery_slot text;

-- ---------------------------------------------------------------------------
--  3. place_order(): enforce the delivery area and the chosen slot.
--     Replaces the hardening version: keeps every hardening rule and adds:
--       · the address must contain a serviceable 6-digit PIN code
--       · the slot must be one of the admin's delivery options
-- ---------------------------------------------------------------------------
drop function if exists public.place_order(jsonb, text, text, text, text, text);

create or replace function public.place_order(
  p_items         jsonb,
  p_customer_name text,
  p_phone         text,
  p_address       text,
  p_notes         text default null,
  p_coupon        text default null,
  p_delivery_slot text default null
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
  v_pincode   text;
  v_slot      text;
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
  if jsonb_array_length(p_items) > 50 then
    raise exception 'An order can contain at most 50 different items.' using errcode = 'P0001';
  end if;

  -- Input caps: these fields feed the admin/customer directory and SMS calls.
  if char_length(trim(p_customer_name)) = 0 or char_length(trim(p_customer_name)) > 100 then
    raise exception 'Please provide your name (maximum 100 characters).' using errcode = 'P0001';
  end if;
  if char_length(trim(p_phone)) = 0
     or char_length(trim(p_phone)) > 20
     or length(regexp_replace(p_phone, '\D', '', 'g')) < 10 then
    raise exception 'Please provide a valid phone number (at least 10 digits).' using errcode = 'P0001';
  end if;
  if char_length(trim(p_address)) = 0 or char_length(trim(p_address)) > 500 then
    raise exception 'Please provide a delivery address (maximum 500 characters).' using errcode = 'P0001';
  end if;
  if p_notes is not null and char_length(p_notes) > 500 then
    raise exception 'Order notes are limited to 500 characters.' using errcode = 'P0001';
  end if;

  select * into v_settings from public.store_settings where id = 1;
  if not found then
    raise exception 'The store is not configured yet.' using errcode = 'P0001';
  end if;
  if not v_settings.is_open then
    raise exception 'The store is currently closed. Please try again later.' using errcode = 'P0001';
  end if;

  -- ---------------------------------------------------------------------
  --  Delivery area: only admin-approved PIN codes may check out.
  --  (\m … \M = a standalone 6-digit run, so 10-digit phone numbers inside
  --  the address can never be mistaken for a PIN code.)
  -- ---------------------------------------------------------------------
  v_pincode := substring(p_address from '\m\d{6}\M');
  if v_pincode is null then
    raise exception 'Please add a 6-digit PIN code to your delivery address.' using errcode = 'P0001';
  end if;
  if not exists (
    select 1
    from unnest(string_to_array(coalesce(v_settings.serviceable_pincodes, '312601'), ',')) as code
    where trim(code) = v_pincode
  ) then
    raise exception 'We currently deliver only to PIN code(s): %.',
      trim(coalesce(v_settings.serviceable_pincodes, '312601'))
      using errcode = 'P0001';
  end if;

  -- ---------------------------------------------------------------------
  --  Delivery time: the customer must pick one of the admin's options.
  -- ---------------------------------------------------------------------
  v_slot := nullif(trim(coalesce(p_delivery_slot, '')), '');
  if char_length(coalesce(v_slot, '')) > 80 then
    raise exception 'Delivery time option is too long.' using errcode = 'P0001';
  end if;
  if jsonb_array_length(coalesce(v_settings.delivery_options, '[]'::jsonb)) > 0 then
    if v_slot is null or not exists (
      select 1 from jsonb_array_elements_text(v_settings.delivery_options) as option_label
      where option_label = v_slot
    ) then
      raise exception 'Please choose one of the delivery time options.' using errcode = 'P0001';
    end if;
  end if;

  -- Merge duplicate lines for the same product first, so the subtotal and the
  -- stock decrement always agree and each row is locked exactly once.
  for v_item in
    select jsonb_build_object('product_id', t.product_id, 'quantity', t.quantity)
    from (
      select
        (e ->> 'product_id')::uuid as product_id,
        sum(greatest(coalesce((e ->> 'quantity')::int, 1), 1))::int as quantity
      from jsonb_array_elements(p_items) as e
      group by 1
    ) as t
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
    -- Lock the coupon row so concurrent orders cannot exceed its usage limit.
    select * into v_coupon
    from public.coupons
    where upper(code) = upper(trim(p_coupon)) and is_active
    for update;

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
    customer_name, phone, address, notes, delivery_slot
  ) values (
    v_number, v_uid, 'placed', 'cod',
    v_subtotal, v_discount, v_delivery, v_total, v_coupon_code,
    trim(p_customer_name), trim(p_phone), trim(p_address),
    nullif(trim(coalesce(p_notes, '')), ''), v_slot
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
    'coupon_code', v_coupon_code,
    'delivery_slot', v_slot
  );
end;
$$;

revoke all on function public.place_order(jsonb, text, text, text, text, text, text) from public;
grant execute on function public.place_order(jsonb, text, text, text, text, text, text) to authenticated;
