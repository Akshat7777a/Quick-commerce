import { supabase, supabaseConfigured } from "./supabase";
import { demo } from "./demo";
import { demoMode } from "./demo-mode";
import type { ProductImportPayload } from "./import-products";
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

const MISSING_SCHEMA_CODES = new Set(["PGRST205", "PGRST202", "PGRST204", "42P01", "42883"]);

/** The DB hasn't had the migration applied yet → run on local preview data. */
function isMissingSchema(error: unknown): boolean {
  const err = error as { code?: string; message?: string } | null;
  if (!err) return false;
  if (err.code && MISSING_SCHEMA_CODES.has(err.code)) return true;
  return /could not find the (table|function)|relation .* does not exist|schema cache/i.test(
    err.message ?? "",
  );
}

async function run<T>(real: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
  if (!supabaseConfigured || demoMode.isEnabled()) {
    demoMode.enable();
    return fallback();
  }
  try {
    const value = await real();
    demoMode.markLive();
    return value;
  } catch (error) {
    if (isMissingSchema(error)) {
      demoMode.enable();
      return fallback();
    }
    throw error;
  }
}

function unwrap<T>(response: { data: T | null; error: unknown }): T {
  if (response.error) throw response.error;
  return response.data as T;
}

export function errorMessage(error: unknown, fallback = "Something went wrong. Please try again.") {
  const err = error as { message?: string; details?: string; hint?: string } | null;
  const message = err?.message?.trim();
  if (message && !/^(invalid input syntax|duplicate key)/i.test(message)) return message;
  if (message) return message;
  return fallback;
}

const cleanSearch = (value: string) => value.trim().replace(/[%,()*]/g, "");

export type ProductQuery = {
  search?: string;
  categoryId?: string | null;
  featured?: boolean;
  includeInactive?: boolean;
  sort?: "featured" | "price-asc" | "price-desc" | "name";
  limit?: number;
};

export const api = {
  /* ---------------------------------------------------------------- catalogue */
  listCategories(): Promise<Category[]> {
    return run(
      async () =>
        unwrap(
          await supabase
            .from("categories")
            .select("*")
            .eq("is_active", true)
            .order("sort_order", { ascending: true }),
        ) as Category[],
      () => demo.listCategories(),
    );
  },

  adminListCategories(): Promise<Category[]> {
    return run(
      async () =>
        unwrap(
          await supabase.from("categories").select("*").order("sort_order", { ascending: true }),
        ) as Category[],
      () => demo.listCategories(true),
    );
  },

  listProducts(opts: ProductQuery = {}): Promise<Product[]> {
    return run(
      async () => {
        let query = supabase.from("products").select("*, category:categories(id,name,slug)");
        if (!opts.includeInactive) query = query.eq("is_active", true);
        if (opts.categoryId) query = query.eq("category_id", opts.categoryId);
        if (opts.featured) query = query.eq("is_featured", true);
        if (opts.search && cleanSearch(opts.search)) {
          query = query.ilike("name", `%${cleanSearch(opts.search)}%`);
        }

        if (opts.sort === "price-asc") query = query.order("price", { ascending: true });
        else if (opts.sort === "price-desc") query = query.order("price", { ascending: false });
        else if (opts.sort === "name") query = query.order("name", { ascending: true });
        else query = query.order("is_featured", { ascending: false }).order("created_at", { ascending: false });

        if (opts.limit) query = query.limit(opts.limit);
        return unwrap(await query) as Product[];
      },
      () => demo.listProducts(opts),
    );
  },

  getProductBySlug(slug: string): Promise<Product | null> {
    return run(
      async () =>
        unwrap(
          await supabase
            .from("products")
            .select("*, category:categories(id,name,slug)")
            .eq("slug", slug)
            .maybeSingle(),
        ) as Product | null,
      () => demo.getProductBySlug(slug),
    );
  },

  listBanners(includeInactive = false): Promise<Banner[]> {
    return run(
      async () => {
        let query = supabase.from("banners").select("*").order("sort_order", { ascending: true });
        if (!includeInactive) query = query.eq("is_active", true);
        return unwrap(await query) as Banner[];
      },
      () => demo.listBanners(includeInactive),
    );
  },

  listCoupons(includeInactive = false): Promise<Coupon[]> {
    return run(
      async () => {
        let query = supabase.from("coupons").select("*").order("created_at", { ascending: true });
        if (!includeInactive) query = query.eq("is_active", true);
        return unwrap(await query) as Coupon[];
      },
      () => demo.listCoupons(includeInactive),
    );
  },

  getSettings(): Promise<StoreSettings> {
    return run(
      async () =>
        unwrap(await supabase.from("store_settings").select("*").eq("id", 1).single()) as StoreSettings,
      () => demo.getSettings(),
    );
  },

  /* ------------------------------------------------------------------- account */
  getProfile(userId: string): Promise<Profile | null> {
    return run(
      async () =>
        unwrap(
          await supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        ) as Profile | null,
      async () => null,
    );
  },

  updateProfile(userId: string, patch: { full_name?: string; phone?: string }): Promise<void> {
    return run(
      async () => {
        const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
        if (error) throw error;
      },
      async () => undefined,
    );
  },

  /* -------------------------------------------------------------------- orders */
  validateCoupon(code: string, subtotal: number): Promise<CouponCheck> {
    return run(
      async () =>
        unwrap(
          await supabase.rpc("validate_coupon", { p_code: code, p_subtotal: subtotal }),
        ) as CouponCheck,
      () => demo.validateCoupon(code, subtotal),
    );
  },

  placeOrder(input: PlaceOrderInput, userId: string): Promise<PlaceOrderResult> {
    return run(
      async () =>
        unwrap(
          await supabase.rpc("place_order", {
            p_items: input.items,
            p_customer_name: input.customerName,
            p_phone: input.phone,
            p_address: input.address,
            p_notes: input.notes ?? null,
            p_coupon: input.coupon ?? null,
            p_delivery_slot: input.deliverySlot ?? null,
          }),
        ) as PlaceOrderResult,
      () => demo.placeOrder(input, userId),
    );
  },

  listOrders(userId: string): Promise<Order[]> {
    return run(
      async () =>
        unwrap(
          await supabase
            .from("orders")
            .select("*, order_items(*)")
            .eq("user_id", userId)
            .order("created_at", { ascending: false }),
        ) as Order[],
      () => demo.listOrders(userId),
    );
  },

  adminListOrders(): Promise<Order[]> {
    return run(
      async () =>
        unwrap(
          await supabase
            .from("orders")
            .select("*, order_items(*)")
            .order("created_at", { ascending: false }),
        ) as Order[],
      () => demo.listAllOrders(),
    );
  },

  /** Customer directory: contact details + lifetime stats. Admin only (RPC-guarded). */
  adminListCustomers(): Promise<Customer[]> {
    return run(
      async () => unwrap(await supabase.rpc("admin_customers")) as Customer[],
      () => demo.listCustomers(),
    );
  },

  updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
    return run(
      async () => {
        const { error } = await supabase.from("orders").update({ status }).eq("id", id);
        if (error) throw error;
      },
      () => demo.updateOrderStatus(id, status),
    );
  },

  /* --------------------------------------------------------------------- admin */
  saveCategory(input: Partial<Category> & { name: string; slug: string }): Promise<Category> {
    return run(
      async () => {
        const payload = {
          name: input.name,
          slug: input.slug,
          description: input.description ?? null,
          emoji: input.emoji ?? null,
          image_url: input.image_url ?? null,
          sort_order: input.sort_order ?? 0,
          is_active: input.is_active ?? true,
        };
        const response = input.id
          ? await supabase.from("categories").update(payload).eq("id", input.id).select().single()
          : await supabase.from("categories").insert(payload).select().single();
        return unwrap(response) as Category;
      },
      () => demo.saveCategory(input),
    );
  },

  deleteCategory(id: string): Promise<void> {
    return run(
      async () => {
        const { error } = await supabase.from("categories").delete().eq("id", id);
        if (error) throw error;
      },
      () => demo.deleteCategory(id),
    );
  },

  saveProduct(
    input: Partial<Product> & { name: string; slug: string; price: number },
  ): Promise<Product> {
    return run(
      async () => {
        const payload = {
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
        };
        const response = input.id
          ? await supabase.from("products").update(payload).eq("id", input.id).select().single()
          : await supabase.from("products").insert(payload).select().single();
        return unwrap(response) as Product;
      },
      () => demo.saveProduct(input),
    );
  },

  deleteProduct(id: string): Promise<void> {
    return run(
      async () => {
        const { error } = await supabase.from("products").delete().eq("id", id);
        if (error) throw error;
      },
      () => demo.deleteProduct(id),
    );
  },

  /** Bulk product import from CSV: inserts new rows, upserts existing ones. */
  adminImportProducts(create: ProductImportPayload[], update: ProductImportPayload[]): Promise<void> {
    // New rows must not carry an `id` key at all — PostgREST derives its
    // `columns` list from Object.keys, and an id: undefined entry would make
    // the column list disagree with the serialized JSON body (HTTP 400).
    const stripId = (row: ProductImportPayload): ProductImportPayload => {
      const clone: ProductImportPayload = { ...row };
      delete clone.id;
      return clone;
    };
    return run(
      async () => {
        if (create.length > 0) {
          const { error } = await supabase.from("products").insert(create.map(stripId));
          if (error) throw error;
        }
        if (update.length > 0) {
          const { error } = await supabase.from("products").upsert(update, { onConflict: "id" });
          if (error) throw error;
        }
      },
      async () => {
        for (const row of update) await demo.saveProduct(row);
        for (const row of create) await demo.saveProduct(row);
      },
    );
  },

  saveBanner(input: Partial<Banner> & { title: string }): Promise<Banner> {
    return run(
      async () => {
        const payload = {
          title: input.title,
          subtitle: input.subtitle ?? null,
          eyebrow: input.eyebrow ?? null,
          image_url: input.image_url ?? null,
          cta_label: input.cta_label ?? "Shop now",
          cta_link: input.cta_link ?? "/shop",
          tone: input.tone ?? "forest",
          is_active: input.is_active ?? true,
          sort_order: input.sort_order ?? 0,
        };
        const response = input.id
          ? await supabase.from("banners").update(payload).eq("id", input.id).select().single()
          : await supabase.from("banners").insert(payload).select().single();
        return unwrap(response) as Banner;
      },
      () => demo.saveBanner(input),
    );
  },

  deleteBanner(id: string): Promise<void> {
    return run(
      async () => {
        const { error } = await supabase.from("banners").delete().eq("id", id);
        if (error) throw error;
      },
      () => demo.deleteBanner(id),
    );
  },

  saveCoupon(input: Partial<Coupon> & { code: string; discount_value: number }): Promise<Coupon> {
    return run(
      async () => {
        const payload = {
          code: input.code.trim().toUpperCase(),
          description: input.description ?? null,
          discount_type: input.discount_type ?? "percent",
          discount_value: input.discount_value,
          min_order: input.min_order ?? 0,
          max_discount: input.max_discount ?? null,
          usage_limit: input.usage_limit ?? null,
          starts_at: input.starts_at ?? null,
          expires_at: input.expires_at ?? null,
          is_active: input.is_active ?? true,
        };
        const response = input.id
          ? await supabase.from("coupons").update(payload).eq("id", input.id).select().single()
          : await supabase.from("coupons").insert(payload).select().single();
        return unwrap(response) as Coupon;
      },
      () => demo.saveCoupon(input),
    );
  },

  deleteCoupon(id: string): Promise<void> {
    return run(
      async () => {
        const { error } = await supabase.from("coupons").delete().eq("id", id);
        if (error) throw error;
      },
      () => demo.deleteCoupon(id),
    );
  },

  saveSettings(patch: Partial<StoreSettings>): Promise<StoreSettings> {
    return run(
      async () => {
        const response = await supabase
          .from("store_settings")
          .update(patch)
          .eq("id", 1)
          .select()
          .single();
        return unwrap(response) as StoreSettings;
      },
      () => demo.saveSettings(patch),
    );
  },

  async uploadImage(file: File, folder = "products"): Promise<string> {
    if (!supabaseConfigured || demoMode.isEnabled()) return demo.uploadImage(file);
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
    const { error } = await supabase.storage
      .from("product-images")
      .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
    if (error) throw error;
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    return data.publicUrl;
  },
};
