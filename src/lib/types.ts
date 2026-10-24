export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  emoji: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
};

export type Product = {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  mrp: number | null;
  unit: string;
  image_url: string | null;
  stock: number;
  is_active: boolean;
  is_featured: boolean;
  created_at?: string;
  updated_at?: string;
  category?: Pick<Category, "id" | "name" | "slug"> | null;
};

export type Banner = {
  id: string;
  eyebrow: string | null;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  cta_label: string | null;
  cta_link: string | null;
  tone: "forest" | "cream" | "gold" | "ink";
  is_active: boolean;
  sort_order: number;
  created_at?: string;
};

export type Coupon = {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percent" | "flat";
  discount_value: number;
  min_order: number;
  max_discount: number | null;
  usage_limit: number | null;
  used_count: number;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at?: string;
};

export type StoreSettings = {
  id: number;
  store_name: string;
  tagline: string | null;
  announcement: string | null;
  is_open: boolean;
  phone: string | null;
  address: string | null;
  delivery_fee: number;
  free_delivery_above: number;
  min_order: number;
  delivery_estimate: string | null;
  updated_at?: string;
};

export type OrderStatus = "placed" | "packed" | "out_for_delivery" | "delivered" | "cancelled";

export type OrderItem = {
  id: string;
  order_id?: string;
  product_id: string | null;
  name: string;
  unit: string | null;
  price: number;
  quantity: number;
  image_url: string | null;
};

export type Order = {
  id: string;
  order_number: string;
  user_id: string;
  status: OrderStatus;
  payment_method: "cod";
  subtotal: number;
  discount: number;
  delivery_fee: number;
  total: number;
  coupon_code: string | null;
  customer_name: string;
  phone: string;
  address: string;
  notes: string | null;
  created_at: string;
  updated_at?: string;
  order_items?: OrderItem[];
};

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: "customer" | "admin";
  created_at?: string;
};

/** One row of the admin-only customer directory (admin_customers RPC). */
export type Customer = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  joined_at: string;
  total_orders: number;
  delivered_orders: number;
  total_spent: number;
  last_order_at: string | null;
  last_order_number: string | null;
  last_order_status: OrderStatus | null;
};

export type CouponCheck = {
  valid: boolean;
  discount: number;
  message: string;
  code?: string;
};

export type PlaceOrderInput = {
  items: { product_id: string; quantity: number }[];
  customerName: string;
  phone: string;
  address: string;
  notes?: string;
  coupon?: string | null;
};

export type PlaceOrderResult = {
  order_id: string;
  order_number: string;
  subtotal: number;
  discount: number;
  delivery_fee: number;
  total: number;
  coupon_code: string | null;
};
