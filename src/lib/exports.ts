import { api } from "./api";
import type { Order } from "./types";

/**
 * Every dataset the admin panel can export as CSV.
 * Column values stay spreadsheet-friendly: raw numbers (no ₹ or separators),
 * `true`/`false` for booleans, ISO dates, empty string for null — so files
 * round-trip back through the product importer and open cleanly in Excel.
 */

export type ExportColumn = { key: string; header: string };

export type ExportDataset = {
  id: string;
  label: string;
  description: string;
  /** Base filename; the export adds `-YYYY-MM-DD.csv`. */
  file: string;
  columns: ExportColumn[];
  load: () => Promise<Array<Record<string, unknown>>>;
};

const bool = (value: unknown) => (value ? "true" : "false");
const empty = (value: unknown) => (value === null || value === undefined ? "" : value);

const productColumns: ExportColumn[] = [
  { key: "name", header: "name" },
  { key: "slug", header: "slug" },
  { key: "category", header: "category" },
  { key: "price", header: "price" },
  { key: "mrp", header: "mrp" },
  { key: "unit", header: "unit" },
  { key: "stock", header: "stock" },
  { key: "is_active", header: "is_active" },
  { key: "is_featured", header: "is_featured" },
  { key: "description", header: "description" },
  { key: "image_url", header: "image_url" },
];

export const EXPORT_DATASETS: ExportDataset[] = [
  {
    id: "products",
    label: "Products",
    description: "Full catalogue — the same columns the importer accepts, so this file round-trips.",
    file: "lmart-products",
    columns: productColumns,
    load: async () => {
      const products = await api.listProducts({ includeInactive: true });
      return products.map((product) => ({
        name: product.name,
        slug: product.slug,
        category: product.category?.slug ?? "",
        price: product.price,
        mrp: empty(product.mrp),
        unit: product.unit,
        stock: product.stock,
        is_active: bool(product.is_active),
        is_featured: bool(product.is_featured),
        description: empty(product.description),
        image_url: empty(product.image_url),
      }));
    },
  },
  {
    id: "sales",
    label: "Sales (line items)",
    description: "One row per item sold, with the order it belongs to — ready for pivot tables.",
    file: "lmart-sales",
    columns: [
      { key: "order_number", header: "order_number" },
      { key: "ordered_at", header: "ordered_at" },
      { key: "status", header: "status" },
      { key: "product", header: "product" },
      { key: "unit", header: "unit" },
      { key: "price", header: "price" },
      { key: "quantity", header: "quantity" },
      { key: "line_total", header: "line_total" },
      { key: "customer_name", header: "customer_name" },
      { key: "phone", header: "phone" },
    ],
    load: async () => {
      const orders = await api.adminListOrders();
      return orders.flatMap((order) =>
        (order.order_items ?? []).map((item) => ({
          order_number: order.order_number,
          ordered_at: order.created_at,
          status: order.status,
          product: item.name,
          unit: empty(item.unit),
          price: item.price,
          quantity: item.quantity,
          line_total: Math.round(Number(item.price) * item.quantity * 100) / 100,
          customer_name: order.customer_name,
          phone: order.phone,
        })),
      );
    },
  },
  {
    id: "orders",
    label: "Orders",
    description: "Every order with totals, coupon and delivery details — the sales register.",
    file: "lmart-orders",
    columns: [
      { key: "order_number", header: "order_number" },
      { key: "created_at", header: "created_at" },
      { key: "status", header: "status" },
      { key: "payment_method", header: "payment_method" },
      { key: "customer_name", header: "customer_name" },
      { key: "phone", header: "phone" },
      { key: "address", header: "address" },
      { key: "subtotal", header: "subtotal" },
      { key: "discount", header: "discount" },
      { key: "delivery_fee", header: "delivery_fee" },
      { key: "total", header: "total" },
      { key: "coupon_code", header: "coupon_code" },
      { key: "items", header: "items" },
      { key: "notes", header: "notes" },
    ],
    load: async () => {
      const orders = await api.adminListOrders();
      return orders.map((order: Order) => ({
        order_number: order.order_number,
        created_at: order.created_at,
        status: order.status,
        payment_method: order.payment_method,
        customer_name: order.customer_name,
        phone: order.phone,
        address: order.address,
        subtotal: order.subtotal,
        discount: order.discount,
        delivery_fee: order.delivery_fee,
        total: order.total,
        coupon_code: empty(order.coupon_code),
        items: (order.order_items ?? []).reduce((sum, item) => sum + item.quantity, 0),
        notes: empty(order.notes),
      }));
    },
  },
  {
    id: "customers",
    label: "Customers",
    description: "Contact directory with order counts and lifetime spend (admin-only data).",
    file: "lmart-customers",
    columns: [
      { key: "full_name", header: "name" },
      { key: "email", header: "email" },
      { key: "phone", header: "phone" },
      { key: "joined_at", header: "joined_at" },
      { key: "total_orders", header: "total_orders" },
      { key: "delivered_orders", header: "delivered_orders" },
      { key: "total_spent", header: "total_spent" },
      { key: "last_order_at", header: "last_order_at" },
      { key: "last_order_number", header: "last_order_number" },
      { key: "last_order_status", header: "last_order_status" },
    ],
    load: async () => {
      const customers = await api.adminListCustomers();
      return customers.map((customer) => ({
        full_name: empty(customer.full_name),
        email: empty(customer.email),
        phone: empty(customer.phone),
        joined_at: customer.joined_at,
        total_orders: customer.total_orders,
        delivered_orders: customer.delivered_orders,
        total_spent: customer.total_spent,
        last_order_at: empty(customer.last_order_at),
        last_order_number: empty(customer.last_order_number),
        last_order_status: empty(customer.last_order_status),
      }));
    },
  },
  {
    id: "categories",
    label: "Categories",
    description: "Category list — can also be edited in a sheet and re-imported later.",
    file: "lmart-categories",
    columns: [
      { key: "name", header: "name" },
      { key: "slug", header: "slug" },
      { key: "description", header: "description" },
      { key: "emoji", header: "emoji" },
      { key: "image_url", header: "image_url" },
      { key: "sort_order", header: "sort_order" },
      { key: "is_active", header: "is_active" },
    ],
    load: async () => {
      const categories = await api.adminListCategories();
      return categories.map((category) => ({
        name: category.name,
        slug: category.slug,
        description: empty(category.description),
        emoji: empty(category.emoji),
        image_url: empty(category.image_url),
        sort_order: category.sort_order,
        is_active: bool(category.is_active),
      }));
    },
  },
  {
    id: "coupons",
    label: "Coupons",
    description: "Coupon codes with limits, usage counts and validity windows.",
    file: "lmart-coupons",
    columns: [
      { key: "code", header: "code" },
      { key: "description", header: "description" },
      { key: "discount_type", header: "discount_type" },
      { key: "discount_value", header: "discount_value" },
      { key: "min_order", header: "min_order" },
      { key: "max_discount", header: "max_discount" },
      { key: "usage_limit", header: "usage_limit" },
      { key: "used_count", header: "used_count" },
      { key: "starts_at", header: "starts_at" },
      { key: "expires_at", header: "expires_at" },
      { key: "is_active", header: "is_active" },
    ],
    load: async () => {
      const coupons = await api.listCoupons(true);
      return coupons.map((coupon) => ({
        code: coupon.code,
        description: empty(coupon.description),
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        min_order: coupon.min_order,
        max_discount: empty(coupon.max_discount),
        usage_limit: empty(coupon.usage_limit),
        used_count: coupon.used_count,
        starts_at: empty(coupon.starts_at),
        expires_at: empty(coupon.expires_at),
        is_active: bool(coupon.is_active),
      }));
    },
  },
  {
    id: "banners",
    label: "Banners",
    description: "Home page banners with their tones, links and ordering.",
    file: "lmart-banners",
    columns: [
      { key: "title", header: "title" },
      { key: "eyebrow", header: "eyebrow" },
      { key: "subtitle", header: "subtitle" },
      { key: "image_url", header: "image_url" },
      { key: "cta_label", header: "cta_label" },
      { key: "cta_link", header: "cta_link" },
      { key: "tone", header: "tone" },
      { key: "sort_order", header: "sort_order" },
      { key: "is_active", header: "is_active" },
    ],
    load: async () => {
      const banners = await api.listBanners(true);
      return banners.map((banner) => ({
        title: banner.title,
        eyebrow: empty(banner.eyebrow),
        subtitle: empty(banner.subtitle),
        image_url: empty(banner.image_url),
        cta_label: empty(banner.cta_label),
        cta_link: empty(banner.cta_link),
        tone: banner.tone,
        sort_order: banner.sort_order,
        is_active: bool(banner.is_active),
      }));
    },
  },
  {
    id: "settings",
    label: "Store settings",
    description: "Delivery fee, free-delivery threshold, minimum order and store status.",
    file: "lmart-store-settings",
    columns: [
      { key: "store_name", header: "store_name" },
      { key: "tagline", header: "tagline" },
      { key: "announcement", header: "announcement" },
      { key: "is_open", header: "is_open" },
      { key: "phone", header: "phone" },
      { key: "address", header: "address" },
      { key: "delivery_fee", header: "delivery_fee" },
      { key: "free_delivery_above", header: "free_delivery_above" },
      { key: "min_order", header: "min_order" },
      { key: "delivery_estimate", header: "delivery_estimate" },
    ],
    load: async () => {
      const settings = await api.getSettings();
      return [
        {
          store_name: settings.store_name,
          tagline: empty(settings.tagline),
          announcement: empty(settings.announcement),
          is_open: bool(settings.is_open),
          phone: empty(settings.phone),
          address: empty(settings.address),
          delivery_fee: settings.delivery_fee,
          free_delivery_above: settings.free_delivery_above,
          min_order: settings.min_order,
          delivery_estimate: empty(settings.delivery_estimate),
        },
      ];
    },
  },
];
