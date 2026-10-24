import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import fs from "node:fs";

const db = new PGlite({ extensions: { pg_trgm, pgcrypto } });
const init = fs.readFileSync("supabase/migrations/20261024120000_init.sql", "utf8");
const seed = fs.readFileSync("supabase/migrations/20261024120100_seed.sql", "utf8");
const hardening = fs.readFileSync("supabase/migrations/20261024140000_security_hardening.sql", "utf8");

let failures = 0;
const check = (label, ok, detail = "") => {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
};

// --- Supabase stubs -------------------------------------------------------
await db.exec(`
  create schema if not exists auth;
  create table auth.users (
    id uuid primary key default gen_random_uuid(),
    email text,
    raw_user_meta_data jsonb default '{}'::jsonb
  );
  create or replace function auth.uid()
  returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;

  create role anon nologin;
  create role authenticated nologin;
  grant usage on schema auth to anon, authenticated;

  create schema if not exists storage;
  create table storage.buckets (
    id text primary key, name text, public boolean,
    file_size_limit bigint, allowed_mime_types text[]
  );
  create table storage.objects (
    id uuid primary key default gen_random_uuid(),
    bucket_id text, name text, owner uuid
  );
  alter table storage.objects enable row level security;
`);

// --- Migrations -----------------------------------------------------------
try {
  await db.exec(init);
  check("init migration executes", true);
} catch (error) {
  check("init migration executes", false, error.message);
  process.exit(1);
}

try {
  await db.exec(seed);
  await db.exec(hardening);
  await db.exec(hardening); // must be idempotent
  check("seed + hardening migrations execute (hardening twice)", true);
} catch (error) {
  check("seed + hardening migrations execute (hardening twice)", false, error.message);
  process.exit(1);
}

const one = async (sql, params) => (await db.query(sql, params)).rows[0];

const productCount = await one("select count(*)::int as n from public.products");
check("products seeded", productCount.n === 38, `${productCount.n} rows`);
const categoryCount = await one("select count(*)::int as n from public.categories");
check("categories seeded", categoryCount.n === 8, `${categoryCount.n} rows`);
const bannerCount = await one("select count(*)::int as n from public.banners");
check("banners seeded", bannerCount.n === 3, `${bannerCount.n} rows`);

// --- Auth trigger ---------------------------------------------------------
const userId = "11111111-1111-4111-8111-111111111111";
await db.query(
  `insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3::jsonb)`,
  [userId, "shopper@lmart.test", JSON.stringify({ full_name: "Test Shopper" })],
);
const profile = await one("select * from public.profiles where id = $1", [userId]);
check("profile created by trigger", profile?.full_name === "Test Shopper", profile?.role);

// --- Coupon validation ----------------------------------------------------
const coupon = await one("select public.validate_coupon('first15', 500) as r");
check("valid coupon computes 15%", coupon.r.valid === true && Number(coupon.r.discount) === 75, JSON.stringify(coupon.r));
const badCoupon = await one("select public.validate_coupon('NOPE', 500) as r");
check("unknown coupon rejected", badCoupon.r.valid === false);
const lowCoupon = await one("select public.validate_coupon('FIRST15', 100) as r");
check("minimum order enforced for coupons", lowCoupon.r.valid === false, lowCoupon.r.message);

// --- Place order as authenticated customer --------------------------------
await db.exec(`select set_config('request.jwt.claim.sub', '${userId}', false); set role authenticated;`);

const product = await one(
  "select id, price, stock, name from public.products where slug = 'fresh-bananas-6pc'",
);
const before = await one("select used_count from public.coupons where code = 'FIRST15'");

const placed = await one(
  `select public.place_order(
     $1::jsonb, 'Test Shopper', '+91 98765 43210',
     'Flat 4B, Rose Apartments, 12 Market Road, Bengaluru 560001', 'Ring once', 'FIRST15'
   ) as r`,
  [JSON.stringify([{ product_id: product.id, quantity: 7 }])],
);
check("place_order returns an order", Boolean(placed.r?.order_number), placed.r?.order_number ?? JSON.stringify(placed.r));
// subtotal 7 × 48 = 336, FIRST15 → 15% off (50.40, under the ₹150 cap), delivery ₹25 (< ₹499 free threshold)
const expectedTotal = Math.round((336 - 50.4 + 25) * 100) / 100;
check(
  "server-side total is correct",
  Math.round(Number(placed.r?.total) * 100) / 100 === expectedTotal,
  `expected ${expectedTotal}, got ${placed.r?.total}`,
);

const orderRow = await one("select * from public.orders where order_number = $1", [placed.r.order_number]);
check("order persisted", Boolean(orderRow), orderRow?.order_number);
const itemCount = await one("select count(*)::int as n from public.order_items where order_id = $1", [orderRow.id]);
check("order items persisted", itemCount.n === 1);
const stockAfter = await one("select stock from public.products where id = $1", [product.id]);
check("stock decremented", stockAfter.stock === product.stock - 7, `${product.stock} → ${stockAfter.stock}`);
const couponAfter = await one("select used_count from public.coupons where code = 'FIRST15'");
check("coupon usage incremented", couponAfter.used_count === before.used_count + 1);
const myOrders = await db.query("select * from public.orders");
check("customer can read own orders", myOrders.rows.length === 1);

// --- RLS guards -----------------------------------------------------------
let directInsert = false;
try {
  await db.exec(
    `insert into public.orders (order_number, user_id, customer_name, phone, address, total)
     values ('HACK-1', '${userId}', 'x', 'x', 'x', 0)`,
  );
  directInsert = true;
} catch {
  directInsert = false;
}
check("direct order insert blocked by RLS", directInsert === false);

let promoteRejected = false;
try {
  await db.exec("update public.profiles set role = 'admin' where id = auth.uid()");
} catch {
  promoteRejected = true;
}
const roleAfter = await one("select role from public.profiles where id = $1", [userId]);
check(
  "customer cannot self-promote to admin",
  roleAfter.role === "customer",
  promoteRejected ? "update rejected by RLS/trigger" : `role is ${roleAfter.role}`,
);

// Another customer cannot see the order.
const otherId = "22222222-2222-4222-8222-222222222222";
await db.exec("reset role");
await db.query("insert into auth.users (id, email) values ($1,'other@lmart.test')", [otherId]);
await db.exec(`select set_config('request.jwt.claim.sub', '${otherId}', false); set role authenticated;`);
const otherOrders = await db.query("select * from public.orders");
check("other customer sees no orders", otherOrders.rows.length === 0, `${otherOrders.rows.length} visible`);

// --- Store closed ---------------------------------------------------------
await db.exec("reset role");
await db.exec("update public.store_settings set is_open = false where id = 1");
await db.exec(`select set_config('request.jwt.claim.sub', '${userId}', false); set role authenticated;`);
let closedError = "";
try {
  await db.query(`select public.place_order($1::jsonb,'Test','9999999999','Some address here',null,null)`, [
    JSON.stringify([{ product_id: product.id, quantity: 1 }]),
  ]);
} catch (error) {
  closedError = error.message;
}
check("closed store blocks checkout", /closed/i.test(closedError), closedError);

// --- Admin access ---------------------------------------------------------
await db.exec("reset role");
await db.exec("update public.store_settings set is_open = true where id = 1");
await db.exec(`update public.profiles set role = 'admin' where id = '${userId}'`);
await db.exec(`select set_config('request.jwt.claim.sub', '${userId}', false); set role authenticated;`);
const allOrders = await db.query("select * from public.orders");
check("admin can read all orders", allOrders.rows.length === 1, `${allOrders.rows.length} rows`);
const adminProducts = await db.query("select * from public.products");
check("admin can read products", adminProducts.rows.length === 38);

// --- Storage bucket -------------------------------------------------------
await db.exec("reset role");
const bucket = await one("select * from storage.buckets where id = 'product-images'");
check("storage bucket provisioned", bucket?.public === true);

// --- Security hardening ---------------------------------------------------
// 1. Duplicate cart lines for the same product must merge (qty summed once).
await db.exec("reset role");
await db.exec(`select set_config('request.jwt.claim.sub', '${userId}', false); set role authenticated;`);
const banana2 = await one("select id, price, stock from public.products where slug = 'fresh-bananas-6pc'");
const dup = await one(
  `select public.place_order($1::jsonb, 'Test Shopper', '+91 98765 43210',
     'Flat 4B, Rose Apartments, 12 Market Road, Bengaluru 560001', null, null) as r`,
  [JSON.stringify([
    { product_id: banana2.id, quantity: 3 },
    { product_id: banana2.id, quantity: 2 },
  ])],
);
const dupSubtotal = Math.round(Number(dup.r?.subtotal) * 100) / 100;
check("duplicate cart lines merge in subtotal", dupSubtotal === banana2.price * 5, `got ${dup.r?.subtotal}, expected ${banana2.price * 5}`);
const dupOrder = await one("select id from public.orders where order_number = $1", [dup.r.order_number]);
const dupItems = await one("select count(*)::int as n, coalesce(sum(quantity),0)::int as q from public.order_items where order_id = $1", [dupOrder.id]);
check("duplicate cart lines become one order line", dupItems.n === 1 && dupItems.q === 5, `${dupItems.n} rows, qty ${dupItems.q}`);
const dupStock = await one("select stock from public.products where id = $1", [banana2.id]);
check("stock decremented once by merged quantity", dupStock.stock === banana2.stock - 5, `${banana2.stock} → ${dupStock.stock}`);

// 2. Input caps: address length, phone digits, name length, cart size.
const tooLong = "x".repeat(501);
const expectError = async (label, pattern, params, itemName) => {
  let message = "";
  try {
    await one(
      `select public.place_order($1::jsonb, $2, $3, $4, null, null) as r`,
      [JSON.stringify([{ product_id: banana2.id, quantity: 1 }]), params.name, params.phone, params.address],
    );
  } catch (error) {
    message = error.message;
  }
  check(label, pattern.test(message), message || "no error raised");
  void itemName;
};
await expectError("address over 500 chars rejected", /500 characters/i, { name: "A", phone: "9876543210", address: tooLong });
await expectError("phone without 10 digits rejected", /phone number/i, { name: "A", phone: "12345", address: "Some address here" });
await expectError("name over 100 chars rejected", /name/i, { name: "N".repeat(101), phone: "9876543210", address: "Some address here" });
const manyItems = Array.from({ length: 51 }, (_, i) => ({ product_id: banana2.id, quantity: 1 }));
let capMessage = "";
try {
  await one(`select public.place_order($1::jsonb, 'A', '9876543210', 'Some address here', null, null) as r`, [JSON.stringify(manyItems)]);
} catch (error) {
  capMessage = error.message;
}
check("cart capped at 50 distinct lines", /50 different items/i.test(capMessage), capMessage || "no error raised");

// 3. Sequence and order_items writes are no longer granted to clients.
let seqMessage = "";
try {
  await db.query("select nextval('public.order_number_seq')");
} catch (error) {
  seqMessage = error.message;
}
check("clients cannot draw order numbers directly", /permission denied/i.test(seqMessage), seqMessage || "nextval succeeded");
let itemMessage = "";
try {
  await db.query(
    `insert into public.order_items (order_id, name, price, quantity)
     select id, 'Fake', 1, 1 from public.orders limit 1`,
  );
} catch (error) {
  itemMessage = error.message;
}
check("clients cannot fabricate order lines", /permission denied/i.test(itemMessage), itemMessage || "insert succeeded");

// 4. A signed-in non-admin cannot rewrite their own email/created_at/role.
await db.exec("reset role");
await db.exec(`select set_config('request.jwt.claim.sub', '${otherId}', false); set role authenticated;`);
const otherBefore = await one("select email, full_name, created_at from public.profiles where id = $1", [otherId]);
await db.query("update public.profiles set email = 'hacked@example.com', full_name = 'Renamed', created_at = now() where id = auth.uid()");
await db.exec("reset role");
const otherAfter = await one("select email, full_name, created_at from public.profiles where id = $1", [otherId]);
check("self-update cannot change email", otherAfter.email === otherBefore.email, `${otherBefore.email} → ${otherAfter.email}`);
check("self-update cannot backdate join date", new Date(otherAfter.created_at).getTime() === new Date(otherBefore.created_at).getTime());
check("self-update can still change name", otherAfter.full_name === "Renamed", otherAfter.full_name);
await db.exec(`update public.profiles set full_name = 'Other Shopper' where id = '${otherId}'`);

console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
