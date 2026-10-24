import fs from "node:fs";
const env = fs.readFileSync(".env", "utf8");
const BASE = env.match(/VITE_SUPABASE_URL=(.+)/)[1].trim();
const KEY = env.match(/VITE_SUPABASE_ANON_KEY=(.+)/)[1].trim();

const login = await fetch(`${BASE}/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: { apikey: KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ email: "lmart.store.test@gmail.com", password: "LmartTest#2026" }),
});
const { access_token } = await login.json();
const h = { apikey: KEY, Authorization: `Bearer ${access_token}`, "Content-Type": "application/json", Prefer: "return=minimal" };

const del = await fetch(`${BASE}/rest/v1/orders?order_number=eq.LMO-261024-1001`, { method: "DELETE", headers: h });
console.log("delete order:", del.status);
const stock = await fetch(`${BASE}/rest/v1/products?slug=eq.fresh-bananas-6pc`, {
  method: "PATCH",
  headers: h,
  body: JSON.stringify({ stock: 60 }),
});
console.log("restore stock:", stock.status);
const chk = await fetch(`${BASE}/rest/v1/orders?select=order_number`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
console.log("orders remaining:", JSON.stringify(await chk.json()));
