import fs from "node:fs";

const env = fs.readFileSync(".env", "utf8");
const URL = env.match(/VITE_SUPABASE_URL=(.+)/)[1].trim();
const KEY = env.match(/VITE_SUPABASE_ANON_KEY=(.+)/)[1].trim();
const EMAIL = "lmart.store.test@gmail.com";
const PASSWORD = "LmartTest#2026";

let failures = 0;
const check = (label, ok, detail = "") => {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
};

const anon = async (path, init = {}) => {
  const r = await fetch(`${URL}${path}`, {
    ...init,
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", ...(init.headers || {}) },
  });
  let body = null;
  try { body = await r.json(); } catch { /* empty */ }
  return { status: r.status, body };
};

const authed = async (token, path, init = {}) => {
  const r = await fetch(`${URL}${path}`, {
    ...init,
    headers: { apikey: KEY, Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers || {}) },
  });
  let body = null;
  try { body = await r.json(); } catch { /* empty */ }
  return { status: r.status, body };
};

// 1. Sign in
const login = await anon(`/auth/v1/token?grant_type=password`, {
  method: "POST",
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
});
check("password sign-in returns a session", login.status === 200 && Boolean(login.body?.access_token), `HTTP ${login.status}`);
const token = login.body?.access_token;

// 2. Coupon RPC (anon, read-only)
const coupon = await anon(`/rest/v1/rpc/validate_coupon`, {
  method: "POST",
  body: JSON.stringify({ p_code: "FIRST15", p_subtotal: 500 }),
});
check(
  "validate_coupon works over REST (anon)",
  coupon.status === 200 && coupon.body?.valid === true && Number(coupon.body?.discount) === 75,
  JSON.stringify(coupon.body),
);

// 3. Pick a product and note stock
const prodRes = await anon(`/rest/v1/products?select=id,name,price,stock&slug=eq.fresh-bananas-6pc`);
const product = prodRes.body?.[0];
check("product readable from live DB", Boolean(product), `${product?.name} ₹${product?.price} stock ${product?.stock}`);

// 4. Place a real order (7 bananas = ₹336 ≥ ₹299 → FIRST15 applies, delivery ₹25)
const placed = await authed(token, `/rest/v1/rpc/place_order`, {
  method: "POST",
  body: JSON.stringify({
    p_items: [{ product_id: product.id, quantity: 7 }],
    p_customer_name: "L Mart Test",
    p_phone: "+91 98765 43210",
    p_address: "Flat 4B, Rose Apartments, 12 Market Road, Bengaluru 560001",
    p_notes: "Live verification order",
    p_coupon: "FIRST15",
  }),
});
check("place_order succeeds on live DB", placed.status === 200 && Boolean(placed.body?.order_number), `HTTP ${placed.status} ${JSON.stringify(placed.body).slice(0, 200)}`);
const orderNumber = placed.body?.order_number;
const expectedTotal = Math.round((336 - 50.4 + 25) * 100) / 100;
check(
  "live server-side total is correct",
  Math.round(Number(placed.body?.total) * 100) / 100 === expectedTotal,
  `expected ${expectedTotal}, got ${placed.body?.total}`,
);

// 5. Owner can read their order
const ownerView = await authed(token, `/rest/v1/orders?select=order_number,total,status&order_number=eq.${orderNumber}`);
check("owner can read own order", ownerView.status === 200 && ownerView.body?.length === 1, JSON.stringify(ownerView.body));

// 6. Anon cannot see the order (RLS)
const anonView = await anon(`/rest/v1/orders?select=id&order_number=eq.${orderNumber}`);
check("anon cannot see the order (RLS)", anonView.status === 200 && anonView.body?.length === 0, `${anonView.body?.length} rows`);

// 7. This user is now admin → can see all orders
const adminView = await authed(token, `/rest/v1/orders?select=id`);
check("admin can read all orders", adminView.status === 200 && adminView.body?.length >= 1, `${adminView.body?.length} rows`);

// 8. Admin can write products (RLS allows)
const slug = `verify-${Date.now()}`;
const insert = await authed(token, `/rest/v1/products`, {
  method: "POST",
  headers: { Prefer: "return=representation" },
  body: JSON.stringify({ name: "Verify Item", slug, price: 10, unit: "1 pc", stock: 5, is_active: false }),
});
check("admin insert into products allowed by RLS", insert.status === 201, `HTTP ${insert.status}`);
if (insert.status === 201) {
  const del = await authed(token, `/rest/v1/products?slug=eq.${slug}`, { method: "DELETE" });
  check("admin delete works", del.status === 204, `HTTP ${del.status}`);
}

// 9. Stock decremented by 7
const after = await anon(`/rest/v1/products?select=stock&slug=eq.fresh-bananas-6pc`);
check("stock decremented live", Number(after.body?.[0]?.stock) === product.stock - 7, `${product.stock} → ${after.body?.[0]?.stock}`);

// 10. Closed store blocks checkout
const close = await authed(token, `/rest/v1/store_settings?id=eq.1`, {
  method: "PATCH",
  headers: { Prefer: "return=minimal" },
  body: JSON.stringify({ is_open: false }),
});
check("admin can close the store", close.status === 204, `HTTP ${close.status}`);
const blocked = await authed(token, `/rest/v1/rpc/place_order`, {
  method: "POST",
  body: JSON.stringify({ p_items: [{ product_id: product.id, quantity: 1 }], p_customer_name: "T", p_phone: "9999999999", p_address: "Some address" }),
});
check("closed store blocks checkout live", blocked.status !== 200 && /closed/i.test(blocked.body?.message || ""), JSON.stringify(blocked.body).slice(0, 160));
const reopen = await authed(token, `/rest/v1/store_settings?id=eq.1`, {
  method: "PATCH",
  headers: { Prefer: "return=minimal" },
  body: JSON.stringify({ is_open: true }),
});
check("store reopened", reopen.status === 204, `HTTP ${reopen.status}`);

console.log(`\n${failures === 0 ? "ALL LIVE CHECKS PASSED" : `${failures} LIVE CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
