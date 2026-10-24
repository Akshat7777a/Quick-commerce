-- ============================================================
--  L MART ONLINE · customer directory (admin only)
--  Run in Supabase → SQL Editor (or `supabase db push`).
--  Safe to re-run.
--
--  One row per registered customer with contact details and
--  lifetime stats: order counts, total spend, last order.
--  Phone falls back to the number on their latest order, so
--  customers who signed up before the phone field was
--  required are still reachable.
--  SECURITY DEFINER + explicit is_admin() guard, so only the
--  shop admin can read the whole directory; the function
--  grants nothing to anon.
-- ============================================================

create or replace function public.admin_customers()
returns table (
  id                uuid,
  full_name         text,
  email             text,
  phone             text,
  joined_at         timestamptz,
  total_orders      bigint,
  delivered_orders  bigint,
  total_spent       numeric(12, 2),
  last_order_at     timestamptz,
  last_order_number text,
  last_order_status text
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required.' using errcode = '42501';
  end if;

  return query
  select
    p.id,
    coalesce(nullif(p.full_name, ''), p.email, 'Customer'),
    p.email,
    coalesce(nullif(p.phone, ''), (array_agg(o.phone order by o.created_at desc) filter (where o.phone is not null))[1]),
    p.created_at,
    count(o.id) filter (where o.status <> 'cancelled'),
    count(o.id) filter (where o.status = 'delivered'),
    coalesce(sum(o.total) filter (where o.status <> 'cancelled'), 0)::numeric(12, 2),
    max(o.created_at),
    (array_agg(o.order_number order by o.created_at desc) filter (where o.order_number is not null))[1],
    (array_agg(o.status order by o.created_at desc))[1]
  from public.profiles p
  left join public.orders o on o.user_id = p.id
  group by p.id
  order by max(o.created_at) desc nulls last, p.created_at desc;
end;
$$;

revoke all on function public.admin_customers() from public;
grant execute on function public.admin_customers() to authenticated;
