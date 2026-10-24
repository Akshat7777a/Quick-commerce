import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import fs from "node:fs";

const db = new PGlite({ extensions: { pg_trgm, pgcrypto } });
let failures = 0;
const check = (label, ok, detail = "") => {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
};

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

await db.exec(fs.readFileSync("supabase/migrations/20261024120000_init.sql", "utf8"));
await db.exec(fs.readFileSync("supabase/migrations/20261024120100_seed.sql", "utf8"));
await db.exec(fs.readFileSync("supabase/migrations/20261024130000_customer_directory.sql", "utf8"));
check("all three migrations execute", true);

const one = async (sql, params) => (await db.query(sql, params)).rows[0];

// Two shoppers: one who ordered, one who never did.
const adminId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const buyerId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const lurkerId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
for (const [id, email, name] of [
  [adminId, "admin@lmart.test", "Shop Admin"],
  [buyerId, "buyer@lmart.test", "Ravi Kumar"],
  [lurkerId, "lurker@lmart.test", "Shyam Das"],
]) {
  await db.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3::jsonb)`, [
    id,
    email,
    JSON.stringify({ full_name: name }),
  ]);
}
await db.query(`update public.profiles set role = 'admin' where id = $1`, [adminId]);

const product = await one(`select id, price from public.products where slug = 'fresh-bananas-6pc'`);

// Buyer places two orders (one delivered, one still placed) as themselves.
await db.exec(`select set_config('request.jwt.claim.sub', '${buyerId}', false); set role authenticated;`);
for (const status of ["delivered", "placed"]) {
  const res = await one(`select public.place_order($1::jsonb,'Ravi Kumar','+91 9000000001','12 Mango Lane, Bengaluru 560002',null,null) as r`, [
    JSON.stringify([{ product_id: product.id, quantity: 3 }]),
  ]);
  await db.exec(`reset role`);
  await db.query(`update public.orders set status = $1 where order_number = $2`, [status, res.r.order_number]);
  await db.exec(`select set_config('request.jwt.claim.sub', '${buyerId}', false); set role authenticated;`);
}
await db.exec(`reset role`);

// Customer (non-admin) must be denied.
await db.exec(`select set_config('request.jwt.claim.sub', '${buyerId}', false); set role authenticated;`);
let denied = false;
try {
  await db.query(`select * from public.admin_customers()`);
} catch (error) {
  denied = /admin access required/i.test(error.message);
}
check("non-admin is denied the directory", denied);
await db.exec(`reset role`);

// Anon must be denied too.
await db.exec(`set role anon;`);
let anonDenied = false;
try {
  await db.query(`select * from public.admin_customers()`);
} catch (error) {
  anonDenied = true;
}
check("anon is denied the directory", anonDenied);
await db.exec(`reset role`);

// Admin sees everyone with correct stats.
await db.exec(`select set_config('request.jwt.claim.sub', '${adminId}', false); set role authenticated;`);
const rows = (await db.query(`select * from public.admin_customers()`)).rows;
check("admin sees all three people", rows.length === 3, `${rows.length} rows`);

const buyer = rows.find((r) => r.email === "buyer@lmart.test");
const expectedSpend = Math.round((2 * (3 * 48 + 25)) * 100) / 100; // two ₹144 orders + ₹25 delivery each = ₹338
check("buyer total orders = 2", Number(buyer?.total_orders) === 2, `${buyer?.total_orders}`);
check("buyer delivered = 1", Number(buyer?.delivered_orders) === 1, `${buyer?.delivered_orders}`);
check("buyer total spent includes delivery (₹338)", Number(buyer?.total_spent) === expectedSpend, `${buyer?.total_spent}`);
check("buyer has last order number", /LMO-\d{6}-\d{4}/.test(buyer?.last_order_number ?? ""), buyer?.last_order_number);
check("buyer phone falls back to latest order phone", buyer?.phone === "+91 9000000001", buyer?.phone);

const lurker = rows.find((r) => r.email === "lurker@lmart.test");
check("never-ordered customer still listed with zeros", Number(lurker?.total_orders) === 0 && Number(lurker?.total_spent) === 0 && lurker?.last_order_number == null);

const admin = rows.find((r) => r.email === "admin@lmart.test");
check("admin row present with zero spend", Number(admin?.total_spent) === 0);

console.log(`\n${failures === 0 ? "ALL CUSTOMER DIRECTORY CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
