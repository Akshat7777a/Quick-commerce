import type { Banner, Category, Coupon, Product, StoreSettings } from "./types";

const img = (_id: string, _width = 900): null => null;

const commons = {
  lentils: null,
  flour: null,
  paperTowel: null,
  laundry: null,
  toothpaste: null,
};

export const demoCategories: Category[] = [
  { id: "dc-fruits", name: "Fruits & Vegetables", slug: "fruits-vegetables", description: "Fruits and vegetables", emoji: null, image_url: img("1542838132-92c53300491e"), sort_order: 1, is_active: true },
  { id: "dc-dairy", name: "Dairy & Eggs", slug: "dairy-eggs", description: "Milk, curd, paneer and eggs", emoji: null, image_url: img("1563636619-e9143da7973b"), sort_order: 2, is_active: true },
  { id: "dc-bakery", name: "Bakery", slug: "bakery", description: "Bread and baked goods", emoji: null, image_url: img("1568254183919-78a4f43a2877"), sort_order: 3, is_active: true },
  { id: "dc-staples", name: "Staples & Grains", slug: "staples", description: "Rice, flour and pantry staples", emoji: null, image_url: img("1586201375761-83865001e31c"), sort_order: 4, is_active: true },
  { id: "dc-snacks", name: "Snacks & Munchies", slug: "snacks", description: "Chips, biscuits and sweets", emoji: null, image_url: img("1566478989037-eec170784d0b"), sort_order: 5, is_active: true },
  { id: "dc-beverages", name: "Beverages", slug: "beverages", description: "Tea, coffee and other drinks", emoji: null, image_url: img("1495474472287-4d71bcdd2085"), sort_order: 6, is_active: true },
  { id: "dc-home", name: "Home & Cleaning", slug: "home-care", description: "Cleaning and household products", emoji: null, image_url: img("1583947215259-38e31be8751f"), sort_order: 7, is_active: true },
  { id: "dc-care", name: "Personal Care", slug: "personal-care", description: "Personal care products", emoji: null, image_url: img("1556228720-195a672e8a03"), sort_order: 8, is_active: true },
];

type Seed = [
  name: string,
  slug: string,
  price: number,
  mrp: number,
  unit: string,
  categoryId: string,
  image: string | null,
  description: string,
  featured?: boolean,
  stock?: number,
];

const seed: Seed[] = [
  // Fruits and vegetables
  ["Fresh Bananas", "fresh-bananas-6pc", 48, 60, "6 pcs", "dc-fruits", img("1528825871115-3581a5387919"), "Bananas sold in a 6-piece pack.", true, 60],
  ["Roma Tomatoes", "roma-tomatoes-500g", 42, 55, "500 g", "dc-fruits", img("1592924357228-91a4daadcfea"), "Tomatoes sold by weight.", false, 80],
  ["Farm Potatoes", "farm-potatoes-1kg", 38, 48, "1 kg", "dc-fruits", img("1518977676601-b53f82aba655"), "Potatoes sold by weight.", false, 90],
  ["Red Onions", "red-onions-1kg", 45, 58, "1 kg", "dc-fruits", img("1518977956812-cd3dbadaaf31"), "Red onions sold by weight.", false, 70],
  ["Garden Salad Mix", "garden-salad-mix-250g", 89, 110, "250 g", "dc-fruits", img("1512621776951-a57141f2eefd"), "Salad mix, 250 g.", false, 35],
  ["Hass Avocado", "hass-avocado-2pc", 189, 220, "2 pcs", "dc-fruits", img("1523049673857-eb18f1d7b578"), "Avocados sold in a 2-piece pack.", false, 30],
  ["Sweet Carrots", "sweet-carrots-500g", 36, 44, "500 g", "dc-fruits", img("1447175008436-054170c2e979"), "Carrots sold by weight.", false, 55],
  ["Seasonal Fruit Box", "seasonal-fruit-box-1kg", 349, 420, "1 kg", "dc-fruits", img("1610832958506-aa56368176cf"), "Seasonal fruit box, 1 kg.", true, 25],

  // Dairy and eggs
  ["Full Cream Milk", "full-cream-milk-1l", 68, 72, "1 L", "dc-dairy", img("1563636619-e9143da7973b"), "Full cream milk, 1 L.", true, 120],
  ["Farm Fresh Eggs", "farm-fresh-eggs-10", 96, 110, "10 pcs", "dc-dairy", img("1582722872445-44dc5f7e3c8f"), "Eggs in a 10-piece pack.", false, 80],
  ["Greek Yogurt", "greek-yogurt-400g", 89, 99, "400 g", "dc-dairy", img("1488477181946-6428a0291777"), "Greek yogurt, 400 g.", false, 45],
  ["Paneer Block", "paneer-block-200g", 95, 110, "200 g", "dc-dairy", img("1548907040-4baa42d10919"), "Paneer block, 200 g.", false, 40],
  ["Fresh Curd", "fresh-curd-400g", 62, 70, "400 g", "dc-dairy", img("1600271886742-f049cd451bba"), "Curd, 400 g.", false, 50],

  // Bakery
  ["Sourdough Loaf", "sourdough-loaf", 149, 180, "450 g", "dc-bakery", img("1509440159596-0249088772ff"), "Sourdough loaf, 450 g.", true, 35],
  ["Butter Croissants", "butter-croissants-2pc", 129, 149, "2 pcs", "dc-bakery", img("1555507036-ab1f4038808a"), "Butter croissants, 2-piece pack.", false, 30],
  ["Multigrain Bread", "multigrain-bread-400g", 55, 65, "400 g", "dc-bakery", img("1586444248902-2f64eddc13df"), "Multigrain bread, 400 g.", false, 40],
  ["Morning Pastry Box", "morning-pastry-box", 249, 299, "6 pcs", "dc-bakery", img("1568254183919-78a4f43a2877"), "Assorted pastries, 6-piece pack.", false, 25],

  // Staples
  ["Basmati Rice", "basmati-rice-5kg", 649, 799, "5 kg", "dc-staples", img("1586201375761-83865001e31c"), "Basmati rice, 5 kg.", true, 30],
  ["Cold Pressed Sunflower Oil", "sunflower-oil-1l", 189, 220, "1 L", "dc-staples", img("1474979266404-7eaacbcd87c5"), "Sunflower oil, 1 L.", false, 35],
  ["Whole Wheat Atta", "whole-wheat-atta-5kg", 289, 340, "5 kg", "dc-staples", commons.flour, "Whole wheat flour, 5 kg.", false, 35],
  ["Toor Dal", "toor-dal-1kg", 168, 190, "1 kg", "dc-staples", commons.lentils, "Toor dal, 1 kg.", false, 40],
  ["Garam Masala", "garam-masala-100g", 89, 99, "100 g", "dc-staples", img("1596040033229-a9821ebd058d"), "Garam masala, 100 g.", false, 55],

  // Snacks
  ["Sea Salt Potato Chips", "sea-salt-potato-chips", 40, 45, "90 g", "dc-snacks", img("1566478989037-eec170784d0b"), "Sea salt potato chips, 90 g.", false, 80],
  ["Dark Chocolate 70%", "dark-chocolate-70", 199, 240, "150 g", "dc-snacks", img("1511381939415-e44015466834"), "Dark chocolate, 70% cacao, 150 g.", true, 45],
  ["Butter Cookies", "butter-cookies-300g", 149, 170, "300 g", "dc-snacks", img("1599490659213-e2b9527bd087"), "Butter cookies, 300 g.", false, 45],
  ["Chocolate Assortment", "chocolate-assortment", 299, 349, "12 pcs", "dc-snacks", img("1571212515416-fef01fc43637"), "Chocolate assortment, 12 pieces.", false, 30],

  // Beverages
  ["Arabica Coffee Beans", "arabica-coffee-beans-250g", 449, 499, "250 g", "dc-beverages", img("1559056199-641a0ac8b55e"), "Arabica coffee beans, 250 g.", true, 35],
  ["Assam Tea", "assam-tea-250g", 199, 230, "250 g", "dc-beverages", img("1594631252845-29fc4cc8cde9"), "Assam tea, 250 g.", false, 50],
  ["Cold Brew Coffee", "cold-brew-coffee-250ml", 149, 170, "250 ml", "dc-beverages", img("1521302080334-4bebac2763a6"), "Cold brew coffee, 250 ml.", false, 40],
  ["Orange Juice", "orange-juice-1l", 189, 210, "1 L", "dc-beverages", img("1596462502278-27bfdc403348"), "Orange juice, 1 L.", false, 35],

  // Home and cleaning
  ["Multi-Surface Cleaner", "multi-surface-cleaner-500ml", 179, 199, "500 ml", "dc-home", img("1583947215259-38e31be8751f"), "Multi-surface cleaner, 500 ml.", false, 45],
  ["Laundry Detergent Pods", "laundry-detergent-pods-20", 349, 399, "20 pods", "dc-home", commons.laundry, "Laundry detergent pods, pack of 20.", false, 30],
  ["Kitchen Towels", "kitchen-towels-2rolls", 129, 149, "2 rolls", "dc-home", commons.paperTowel, "Kitchen towels, 2 rolls.", false, 50],

  // Personal care
  ["Coconut Shampoo", "coconut-shampoo-400ml", 299, 349, "400 ml", "dc-care", img("1556228720-195a672e8a03"), "Coconut shampoo, 400 ml.", false, 40],
  ["Vitamin C Face Wash", "vitamin-c-face-wash-100ml", 249, 299, "100 ml", "dc-care", img("1571781926291-c477ebfd024b"), "Vitamin C face wash, 100 ml.", false, 35],
  ["Natural Bath Soap", "natural-bath-soap-3pack", 129, 149, "3 x 100 g", "dc-care", img("1600857544200-b2f666a9a2ec"), "Bath soap, 3 bars.", false, 60],
  ["Bamboo Toothbrush Set", "bamboo-toothbrush-set", 179, 199, "4 pcs", "dc-care", img("1607613009820-a29f7bb81c04"), "Bamboo toothbrush set, 4 pieces.", false, 45],
  ["Mint Toothpaste", "mint-toothpaste-150g", 99, 110, "150 g", "dc-care", commons.toothpaste, "Mint toothpaste, 150 g.", false, 55],
];

export const demoProducts: Product[] = seed.map(
  ([name, slug, price, mrp, unit, categoryId, imageUrl, description, featured, stock], index) => ({
    id: `dp-${index + 1}`,
    category_id: categoryId,
    name,
    slug,
    description,
    price,
    mrp,
    unit,
    image_url: imageUrl,
    stock: stock ?? 40,
    is_active: true,
    is_featured: Boolean(featured),
    created_at: new Date(Date.now() - index * 60_000).toISOString(),
    category: (() => {
      const c = demoCategories.find((c) => c.id === categoryId);
      return c ? { id: c.id, name: c.name, slug: c.slug } : null;
    })(),
  }),
);

export const demoBanners: Banner[] = [
  {
    id: "db-1", eyebrow: "L MART", title: "Groceries and everyday essentials",
    subtitle: "Delivery is currently available in PIN code 312601.",
    image_url: img("1542838132-92c53300491e", 1600), cta_label: "Shop products", cta_link: "/shop",
    tone: "forest", is_active: true, sort_order: 1,
  },
  {
    id: "db-2", eyebrow: "Cash on delivery", title: "Order now. Pay at the door.",
    subtitle: "Pay in cash when your order arrives.",
    image_url: img("1490645935967-10de6ba17061", 1600), cta_label: "Shop products", cta_link: "/shop",
    tone: "cream", is_active: true, sort_order: 2,
  },
  {
    id: "db-3", eyebrow: "First order offer", title: "Save 15% on your first order",
    subtitle: "Use code FIRST15 on orders above ₹299. Maximum discount ₹150.",
    image_url: img("1546069901-ba9599a7e63c", 1600), cta_label: "Browse offers", cta_link: "/offers",
    tone: "gold", is_active: true, sort_order: 3,
  },
];

export const demoCoupons: Coupon[] = [
  {
    id: "dcp-1", code: "FIRST15", description: "15% off your first order", discount_type: "percent",
    discount_value: 15, min_order: 299, max_discount: 150, usage_limit: 500, used_count: 0,
    starts_at: null, expires_at: new Date(Date.now() + 365 * 864e5).toISOString(), is_active: true,
  },
  {
    id: "dcp-2", code: "FRESH50", description: "Flat ₹50 off your basket", discount_type: "flat",
    discount_value: 50, min_order: 499, max_discount: null, usage_limit: 1000, used_count: 0,
    starts_at: null, expires_at: new Date(Date.now() + 365 * 864e5).toISOString(), is_active: true,
  },
  {
    id: "dcp-3", code: "WEEKEND10", description: "10% off weekend baskets", discount_type: "percent",
    discount_value: 10, min_order: 799, max_discount: 200, usage_limit: 500, used_count: 0,
    starts_at: null, expires_at: new Date(Date.now() + 365 * 864e5).toISOString(), is_active: true,
  },
];

export const demoSettings: StoreSettings = {
  id: 1,
  store_name: "L MART ONLINE",
  tagline: "Everyday essentials from your neighbourhood store.",
  announcement: "Free delivery on orders above ₹499 · Cash on delivery",
  is_open: true,
  phone: null,
  address: null,
  delivery_fee: 25,
  free_delivery_above: 499,
  min_order: 99,
  delivery_estimate: "Choose a delivery time at checkout",
  theme_mode: "light",
  theme_preset: "default",
  serviceable_pincodes: "312601",
  delivery_options: [
    "Instant · within 30 minutes",
    "Within 1–2 hours",
    "9:00 AM – 11:00 AM",
    "11:00 AM – 1:00 PM",
    "1:00 PM – 3:00 PM",
    "3:00 PM – 5:00 PM",
    "5:00 PM – 7:00 PM",
    "7:00 PM – 9:00 PM",
  ],
};
