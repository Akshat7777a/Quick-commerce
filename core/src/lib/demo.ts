import type {
  Banner,
  Category,
  Coupon,
  CouponCheck,
  Customer,
  Order,
  OrderStatus,
  PlaceOrderInput,
  PlaceOrderResult,
  Product,
  Profile,
  StoreSettings,
} from "./types";
import {
  demoBanners,
  demoCategories,
  demoCoupons,
  demoProducts,
  demoSettings,
} from "./demo-data";

export const DEMO_USER_ID = "demo-user";
export const DEMO_PROFILE: Profile = {
  id: DEMO_USER_ID,
  email: "preview@lmart.local",
  full_name: "Preview Shopper",
  phone: "+91 98765 43210",
  role: "admin",
};

type DemoState = {
  categories: Category[];
  products: Product[];
  banners: Banner[];
  coupons: Coupon[];
  settings: StoreSettings;
  orders: Order[];
};

const STORAGE_KEY = "lmart.demo.v2";

function seed(): DemoState {
  return {
    categories: structuredClone(demoCategories),
    products: structuredClone(demoProducts),
    banners: structuredClone(demoBanners),
    coupons: structuredClone(demoCoupons),
    settings: structuredClone(demoSettings),
    orders: [],
  };
}

function read(): DemoState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seed();
    const parsed = JSON.parse(raw) as Partial<DemoState>;
    const base = seed();
    return {
      categories: parsed.categories ?? base.categories,
      products: parsed.products ?? base.products,
      banners: parsed.banners ?? base.banners,
      coupons: parsed.coupons ?? base.coupons,
      settings: { ...base.settings, ...(parsed.settings ?? {}) },
      orders: parsed.orders ?? [],
    };
  } catch {
    return seed();
  }
}

function write(state: DemoState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage full — keep the in-memory copy */
  }
}

export function resetDemoData() {
  localStorage.removeItem(STORAGE_KEY);
}

const wait = (ms = 90) => new Promise((resolve) => setTimeout(resolve, ms));
const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;

function withCategory(state: DemoState, product: Product): Product {
  const category = state.categories.find((c) => c.id === product.category_id);
  return {
    ...product,
    category: category ? { id: category.id, name: category.name, slug: category.slug } : null,
  };
}

function money(value: number) {
  return Math.round(value * 100) / 100;
}

function evaluateCoupon(coupon: Coupon, subtotal: number): CouponCheck {
  if (!coupon.is_active) return { valid: false, discount: 0, message: "That coupon code is not valid." };
  if (coupon.starts_at && new Date(coupon.starts_at) > new Date())
    return { valid: false, discount: 0, message: "This coupon is not active yet." };
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date())
    return { valid: false, discount: 0, message: "This coupon has expired." };
  if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit)
    return { valid: false, discount: 0, message: "This coupon has been fully redeemed." };
  if (subtotal < coupon.min_order)
    return {
      valid: false,
      discount: 0,
      message: `Add items worth ₹${Math.ceil(coupon.min_order - subtotal)} more to unlock this coupon.`,
    };

  let discount =
    coupon.discount_type === "percent"
      ? money((subtotal * coupon.discount_value) / 100)
      : coupon.discount_value;
  if (coupon.max_discount !== null) discount = Math.min(discount, coupon.max_discount);
  discount = Math.min(discount, subtotal);
  return { valid: true, discount, message: coupon.description ?? "Coupon applied.", code: coupon.code };
}

export const demo = {
  async listCategories(includeInactive = false): Promise<Category[]> {
    await wait();
    const state = read();
    return state.categories
      .filter((c) => includeInactive || c.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);
  },

  async listProducts(opts: {
    search?: string;
    categoryId?: string | null;
    featured?: boolean;
    includeInactive?: boolean;
    sort?: string;
    limit?: number;
  } = {}): Promise<Product[]> {
    await wait();
    const state = read();
    const term = opts.search?.trim().toLowerCase();
    let rows = state.products
      .filter((p) => opts.includeInactive || p.is_active)
      .filter((p) => (opts.categoryId ? p.category_id === opts.categoryId : true))
      .filter((p) => (opts.featured ? p.is_featured : true))
      .filter((p) =>
        term ? `${p.name} ${p.description ?? ""}`.toLowerCase().includes(term) : true,
      )
      .map((p) => withCategory(state, p));

    if (opts.sort === "price-asc") rows = rows.sort((a, b) => a.price - b.price);
    else if (opts.sort === "price-desc") rows = rows.sort((a, b) => b.price - a.price);
    else if (opts.sort === "name") rows = rows.sort((a, b) => a.name.localeCompare(b.name));
    else
      rows = rows.sort(
        (a, b) =>
          Number(b.is_featured) - Number(a.is_featured) ||
          (b.created_at ?? "").localeCompare(a.created_at ?? ""),
      );

    return opts.limit ? rows.slice(0, opts.limit) : rows;
  },

  async getProductBySlug(slug: string): Promise<Product | null> {
    await wait();
    const state = read();
    const product = state.products.find((p) => p.slug === slug);
    return product ? withCategory(state, product) : null;
  },

  async listBanners(includeInactive = false): Promise<Banner[]> {
    await wait();
    return read()
      .banners.filter((b) => includeInactive || b.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);
  },

  async listCoupons(includeInactive = false): Promise<Coupon[]> {
    await wait();
    return read().coupons.filter((c) => includeInactive || c.is_active);
  },

  async getSettings(): Promise<StoreSettings> {
    await wait();
    return read().settings;
  },

  async validateCoupon(code: string, subtotal: number): Promise<CouponCheck> {
    await wait(200);
    const coupon = read().coupons.find(
      (c) => c.code.toUpperCase() === code.trim().toUpperCase(),
    );
    if (!coupon) return { valid: false, discount: 0, message: "That coupon code is not valid." };
    return evaluateCoupon(coupon, subtotal);
  },

  async placeOrder(input: PlaceOrderInput, userId: string): Promise<PlaceOrderResult> {
    await wait(400);
    const state = read();
    if (!state.settings.is_open) {
      throw new Error("The store is currently closed. Please try again later.");
    }

    let subtotal = 0;
    const items = input.items.map((line) => {
      const product = state.products.find((p) => p.id === line.product_id);
      if (!product) throw new Error("One of the items in your cart is no longer available.");
      if (product.stock < line.quantity) throw new Error(`${product.name} is out of stock.`);
      subtotal += product.price * line.quantity;
      return {
        id: uid(),
        product_id: product.id,
        name: product.name,
        unit: product.unit,
        price: product.price,
        quantity: line.quantity,
        image_url: product.image_url,
      };
    });

    if (subtotal < state.settings.min_order) {
      throw new Error(`Minimum order value is ₹${state.settings.min_order}.`);
    }

    let discount = 0;
    let couponCode: string | null = null;
    if (input.coupon) {
      const coupon = state.coupons.find(
        (c) => c.code.toUpperCase() === input.coupon!.trim().toUpperCase(),
      );
      if (!coupon) throw new Error("Invalid coupon code.");
      const check = evaluateCoupon(coupon, subtotal);
      if (!check.valid) throw new Error(check.message);
      discount = check.discount;
      couponCode = coupon.code;
      coupon.used_count += 1;
    }

    const deliveryFee =
      subtotal >= state.settings.free_delivery_above ? 0 : state.settings.delivery_fee;
    const total = money(subtotal - discount + deliveryFee);
    const now = new Date();
    const stamp = `${now.getFullYear().toString().slice(2)}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const orderNumber = `LMO-${stamp}-${String(1001 + state.orders.length).padStart(4, "0")}`;

    const order: Order = {
      id: uid(),
      order_number: orderNumber,
      user_id: userId,
      status: "placed",
      payment_method: "cod",
      subtotal: money(subtotal),
      discount: money(discount),
      delivery_fee: deliveryFee,
      total,
      coupon_code: couponCode,
      customer_name: input.customerName,
      phone: input.phone,
      address: input.address,
      notes: input.notes ?? null,
      delivery_slot: input.deliverySlot ?? null,
      created_at: now.toISOString(),
      order_items: items,
    };

    state.orders.unshift(order);
    items.forEach((item) => {
      const product = state.products.find((p) => p.id === item.product_id);
      if (product) product.stock = Math.max(product.stock - item.quantity, 0);
    });
    write(state);

    return {
      order_id: order.id,
      order_number: orderNumber,
      subtotal: order.subtotal,
      discount: order.discount,
      delivery_fee: order.delivery_fee,
      total: order.total,
      coupon_code: couponCode,
    };
  },

  async listOrders(userId: string): Promise<Order[]> {
    await wait();
    return read().orders.filter((o) => o.user_id === userId);
  },

  async listAllOrders(): Promise<Order[]> {
    await wait();
    return read().orders;
  },

  async listCustomers(): Promise<Customer[]> {
    await wait();
    const orders = read().orders;
    const byUser = new Map<string, Order[]>();
    for (const order of orders) {
      const list = byUser.get(order.user_id) ?? [];
      list.push(order);
      byUser.set(order.user_id, list);
    }

    const rows: Customer[] = [];
    for (const [userId, list] of byUser) {
      const sorted = [...list].sort((a, b) => b.created_at.localeCompare(a.created_at));
      const live = sorted.filter((order) => order.status !== "cancelled");
      rows.push({
        id: userId,
        full_name: sorted[0].customer_name,
        email: userId === DEMO_USER_ID ? DEMO_PROFILE.email : null,
        phone: sorted[0].phone,
        joined_at: sorted[sorted.length - 1].created_at,
        total_orders: live.length,
        delivered_orders: live.filter((order) => order.status === "delivered").length,
        total_spent: live.reduce((sum, order) => sum + order.total, 0),
        last_order_at: sorted[0].created_at,
        last_order_number: sorted[0].order_number,
        last_order_status: sorted[0].status,
      });
    }
    if (!rows.some((row) => row.id === DEMO_USER_ID)) {
      rows.push({
        id: DEMO_USER_ID,
        full_name: DEMO_PROFILE.full_name,
        email: DEMO_PROFILE.email,
        phone: DEMO_PROFILE.phone,
        joined_at: new Date().toISOString(),
        total_orders: 0,
        delivered_orders: 0,
        total_spent: 0,
        last_order_at: null,
        last_order_number: null,
        last_order_status: null,
      });
    }
    return rows.sort((a, b) => (b.last_order_at ?? "").localeCompare(a.last_order_at ?? ""));
  },

  async updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
    await wait();
    const state = read();
    const order = state.orders.find((o) => o.id === id);
    if (!order) throw new Error("Order not found.");
    order.status = status;
    order.updated_at = new Date().toISOString();
    write(state);
  },

  async saveCategory(input: Partial<Category> & { name: string; slug: string }): Promise<Category> {
    await wait();
    const state = read();
    const existing = input.id ? state.categories.find((c) => c.id === input.id) : undefined;
    if (existing) {
      Object.assign(existing, input);
      write(state);
      return existing;
    }
    const created: Category = {
      id: uid(),
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      emoji: input.emoji ?? null,
      image_url: input.image_url ?? null,
      sort_order: input.sort_order ?? state.categories.length + 1,
      is_active: input.is_active ?? true,
    };
    state.categories.push(created);
    write(state);
    return created;
  },

  async deleteCategory(id: string): Promise<void> {
    await wait();
    const state = read();
    state.categories = state.categories.filter((c) => c.id !== id);
    state.products = state.products.map((p) =>
      p.category_id === id ? { ...p, category_id: null } : p,
    );
    write(state);
  },

  async saveProduct(input: Partial<Product> & { name: string; slug: string; price: number }): Promise<Product> {
    await wait();
    const state = read();
    const existing = input.id ? state.products.find((p) => p.id === input.id) : undefined;
    if (existing) {
      Object.assign(existing, input);
      write(state);
      return withCategory(state, existing);
    }
    const created: Product = {
      id: uid(),
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      price: input.price,
      mrp: input.mrp ?? null,
      unit: input.unit ?? "1 pc",
      image_url: input.image_url ?? null,
      stock: input.stock ?? 0,
      is_active: input.is_active ?? true,
      is_featured: input.is_featured ?? false,
      category_id: input.category_id ?? null,
      created_at: new Date().toISOString(),
    };
    state.products.unshift(created);
    write(state);
    return withCategory(state, created);
  },

  async deleteProduct(id: string): Promise<void> {
    await wait();
    const state = read();
    state.products = state.products.filter((p) => p.id !== id);
    write(state);
  },

  async saveBanner(input: Partial<Banner> & { title: string }): Promise<Banner> {
    await wait();
    const state = read();
    const existing = input.id ? state.banners.find((b) => b.id === input.id) : undefined;
    if (existing) {
      Object.assign(existing, input);
      write(state);
      return existing;
    }
    const created: Banner = {
      id: uid(),
      title: input.title,
      subtitle: input.subtitle ?? null,
      eyebrow: input.eyebrow ?? null,
      image_url: input.image_url ?? null,
      cta_label: input.cta_label ?? "Shop now",
      cta_link: input.cta_link ?? "/shop",
      tone: input.tone ?? "forest",
      is_active: input.is_active ?? true,
      sort_order: input.sort_order ?? state.banners.length + 1,
    };
    state.banners.push(created);
    write(state);
    return created;
  },

  async deleteBanner(id: string): Promise<void> {
    await wait();
    const state = read();
    state.banners = state.banners.filter((b) => b.id !== id);
    write(state);
  },

  async saveCoupon(input: Partial<Coupon> & { code: string; discount_value: number }): Promise<Coupon> {
    await wait();
    const state = read();
    const existing = input.id ? state.coupons.find((c) => c.id === input.id) : undefined;
    if (existing) {
      Object.assign(existing, input, { code: input.code.toUpperCase() });
      write(state);
      return existing;
    }
    const created: Coupon = {
      id: uid(),
      code: input.code.toUpperCase(),
      description: input.description ?? null,
      discount_type: input.discount_type ?? "percent",
      discount_value: input.discount_value,
      min_order: input.min_order ?? 0,
      max_discount: input.max_discount ?? null,
      usage_limit: input.usage_limit ?? null,
      used_count: 0,
      starts_at: input.starts_at ?? null,
      expires_at: input.expires_at ?? null,
      is_active: input.is_active ?? true,
    };
    state.coupons.push(created);
    write(state);
    return created;
  },

  async deleteCoupon(id: string): Promise<void> {
    await wait();
    const state = read();
    state.coupons = state.coupons.filter((c) => c.id !== id);
    write(state);
  },

  async saveSettings(patch: Partial<StoreSettings>): Promise<StoreSettings> {
    await wait();
    const state = read();
    state.settings = { ...state.settings, ...patch };
    write(state);
    return state.settings;
  },

  async uploadImage(file: File): Promise<string> {
    await wait(300);
    return URL.createObjectURL(file);
  },
};
