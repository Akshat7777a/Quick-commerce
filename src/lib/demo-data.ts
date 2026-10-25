import type { Banner, Category, Coupon, Product, StoreSettings } from "./types";

const img = (id: string, w = 900) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

const commons = {
  lentils: "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/da/3_types_of_lentil.jpg/960px-3_types_of_lentil.jpg",
  flour: "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/66/Whole_wheat_grain_flour_being_scooped.jpg/960px-Whole_wheat_grain_flour_being_scooped.jpg",
  paperTowel: "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9d/Paper_towel.png/960px-Paper_towel.png",
  laundry: "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b5/Laundry_detergent_pods.jpg/960px-Laundry_detergent_pods.jpg",
  toothpaste: "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/49/Toothpasteonbrush.jpg/960px-Toothpasteonbrush.jpg",
};

export const demoCategories: Category[] = [
  { id: "dc-fruits", name: "Fruits & Vegetables", slug: "fruits-vegetables", description: "Picked fresh this morning", emoji: "🥬", image_url: img("1542838132-92c53300491e"), sort_order: 1, is_active: true },
  { id: "dc-dairy", name: "Dairy & Eggs", slug: "dairy-eggs", description: "Farm-led, everyday fresh", emoji: "🥛", image_url: img("1563636619-e9143da7973b"), sort_order: 2, is_active: true },
  { id: "dc-bakery", name: "Bakery", slug: "bakery", description: "Baked in small batches", emoji: "🥖", image_url: img("1568254183919-78a4f43a2877"), sort_order: 3, is_active: true },
  { id: "dc-staples", name: "Staples & Grains", slug: "staples", description: "The pantry, sorted", emoji: "🌾", image_url: img("1586201375761-83865001e31c"), sort_order: 4, is_active: true },
  { id: "dc-snacks", name: "Snacks & Munchies", slug: "snacks", description: "Small treats, big moods", emoji: "🍪", image_url: img("1566478989037-eec170784d0b"), sort_order: 5, is_active: true },
  { id: "dc-beverages", name: "Beverages", slug: "beverages", description: "Slow mornings to long days", emoji: "☕", image_url: img("1495474472287-4d71bcdd2085"), sort_order: 6, is_active: true },
  { id: "dc-home", name: "Home & Cleaning", slug: "home-care", description: "A calmer, cleaner home", emoji: "🧼", image_url: img("1583947215259-38e31be8751f"), sort_order: 7, is_active: true },
  { id: "dc-care", name: "Personal Care", slug: "personal-care", description: "Everyday rituals", emoji: "🧴", image_url: img("1556228720-195a672e8a03"), sort_order: 8, is_active: true },
];

type Seed = [
  name: string,
  slug: string,
  price: number,
  mrp: number,
  unit: string,
  categoryId: string,
  image: string,
  description: string,
  featured?: boolean,
  stock?: number,
];

const seed: Seed[] = [
  // Fruits & Vegetables
  ["Fresh Bananas", "fresh-bananas-6pc", 48, 60, "6 pcs", "dc-fruits", img("1528825871115-3581a5387919"), "Naturally ripened, sweet and dependable. Perfect for breakfast or a midday reset.", true, 60],
  ["Roma Tomatoes", "roma-tomatoes-500g", 42, 55, "500 g", "dc-fruits", img("1592924357228-91a4daadcfea"), "Firm, glossy and full of flavour. Grown close to home.", false, 80],
  ["Farm Potatoes", "farm-potatoes-1kg", 38, 48, "1 kg", "dc-fruits", img("1518977676601-b53f82aba655"), "Earthy, versatile staples that hold their shape beautifully.", false, 90],
  ["Red Onions", "red-onions-1kg", 45, 58, "1 kg", "dc-fruits", img("1518977956812-cd3dbadaaf31"), "Crunchy, sharp and essential. Hand-sorted for quality.", false, 70],
  ["Garden Salad Mix", "garden-salad-mix-250g", 89, 110, "250 g", "dc-fruits", img("1512621776951-a57141f2eefd"), "Crisp leaves, cherry tomatoes and avocado. Ready in minutes.", false, 35],
  ["Hass Avocado", "hass-avocado-2pc", 189, 220, "2 pcs", "dc-fruits", img("1523049673857-eb18f1d7b578"), "Creamy, ripe and ready. Toast's best friend.", false, 30],
  ["Sweet Carrots", "sweet-carrots-500g", 36, 44, "500 g", "dc-fruits", img("1447175008436-054170c2e979"), "Sweet, snappy carrots for salads, soups and quick pickles.", false, 55],
  ["Seasonal Fruit Box", "seasonal-fruit-box-1kg", 349, 420, "1 kg", "dc-fruits", img("1610832958506-aa56368176cf"), "A rotating mix of whatever is ripest this week — always worth opening.", true, 25],

  // Dairy & Eggs
  ["Full Cream Milk", "full-cream-milk-1l", 68, 72, "1 L", "dc-dairy", img("1563636619-e9143da7973b"), "Fresh, whole milk from a nearby dairy. Chilled all the way to you.", true, 120],
  ["Farm Fresh Eggs", "farm-fresh-eggs-10", 96, 110, "10 pcs", "dc-dairy", img("1582722872445-44dc5f7e3c8f"), "Free-range eggs with deep golden yolks. Packed the same day.", false, 80],
  ["Greek Yogurt", "greek-yogurt-400g", 89, 99, "400 g", "dc-dairy", img("1488477181946-6428a0291777"), "Thick, tangy and high in protein. Breakfast, sorted.", false, 45],
  ["Paneer Block", "paneer-block-200g", 95, 110, "200 g", "dc-dairy", img("1548907040-4baa42d10919"), "Soft, fresh cottage cheese made in small batches.", false, 40],
  ["Fresh Curd", "fresh-curd-400g", 62, 70, "400 g", "dc-dairy", img("1600271886742-f049cd451bba"), "Cultured slowly for a clean, gentle tang.", false, 50],

  // Bakery
  ["Sourdough Loaf", "sourdough-loaf", 149, 180, "450 g", "dc-bakery", img("1509440159596-0249088772ff"), "A crackling crust and an open, tangy crumb. Baked this morning.", true, 35],
  ["Butter Croissants", "butter-croissants-2pc", 129, 149, "2 pcs", "dc-bakery", img("1555507036-ab1f4038808a"), "Laminated by hand, impossibly flaky. Warm them for two minutes.", false, 30],
  ["Multigrain Bread", "multigrain-bread-400g", 55, 65, "400 g", "dc-bakery", img("1586444248902-2f64eddc13df"), "Seeded, soft and quietly wholesome. Great for everyday toast.", false, 40],
  ["Morning Pastry Box", "morning-pastry-box", 249, 299, "6 pcs", "dc-bakery", img("1568254183919-78a4f43a2877"), "A baker's selection of buttery, golden pastries for slow mornings.", false, 25],

  // Staples
  ["Basmati Rice", "basmati-rice-5kg", 649, 799, "5 kg", "dc-staples", img("1586201375761-83865001e31c"), "Long, fragrant grains that cook up light and separate.", true, 30],
  ["Cold Pressed Sunflower Oil", "sunflower-oil-1l", 189, 220, "1 L", "dc-staples", img("1474979266404-7eaacbcd87c5"), "Light, clean and cold pressed. Nothing added.", false, 35],
  ["Whole Wheat Atta", "whole-wheat-atta-5kg", 289, 340, "5 kg", "dc-staples", commons.flour, "Stone-ground flour for soft rotis and everyday baking.", false, 35],
  ["Toor Dal", "toor-dal-1kg", 168, 190, "1 kg", "dc-staples", commons.lentils, "Golden, unpolished lentils. Comfort in a bowl, every time.", false, 40],
  ["Garam Masala", "garam-masala-100g", 89, 99, "100 g", "dc-staples", img("1596040033229-a9821ebd058d"), "Warm, hand-blended spice. Ground fresh in small batches.", false, 55],

  // Snacks
  ["Sea Salt Potato Chips", "sea-salt-potato-chips", 40, 45, "90 g", "dc-snacks", img("1566478989037-eec170784d0b"), "Kettle-cooked, extra crunchy, lightly salted. Dangerously good.", false, 80],
  ["Dark Chocolate 70%", "dark-chocolate-70", 199, 240, "150 g", "dc-snacks", img("1511381939415-e44015466834"), "Single-origin cacao, slow-melted. A small, serious pleasure.", true, 45],
  ["Butter Cookies", "butter-cookies-300g", 149, 170, "300 g", "dc-snacks", img("1599490659213-e2b9527bd087"), "Short, buttery and baked the old-fashioned way.", false, 45],
  ["Chocolate Assortment", "chocolate-assortment", 299, 349, "12 pcs", "dc-snacks", img("1571212515416-fef01fc43637"), "A tin of familiar favourites. Meant for sharing, rarely shared.", false, 30],

  // Beverages
  ["Arabica Coffee Beans", "arabica-coffee-beans-250g", 449, 499, "250 g", "dc-beverages", img("1559056199-641a0ac8b55e"), "Medium roast with notes of cocoa and orange. Ground to order.", true, 35],
  ["Assam Tea", "assam-tea-250g", 199, 230, "250 g", "dc-beverages", img("1594631252845-29fc4cc8cde9"), "A strong, malty breakfast brew from the Assam valley.", false, 50],
  ["Cold Brew Coffee", "cold-brew-coffee-250ml", 149, 170, "250 ml", "dc-beverages", img("1521302080334-4bebac2763a6"), "Steeped for 18 hours. Smooth, low-acid and ready to pour.", false, 40],
  ["Orange Juice", "orange-juice-1l", 189, 210, "1 L", "dc-beverages", img("1596462502278-27bfdc403348"), "Cold pressed, no added sugar. Bright and properly fresh.", false, 35],

  // Home & Cleaning
  ["Multi-Surface Cleaner", "multi-surface-cleaner-500ml", 179, 199, "500 ml", "dc-home", img("1583947215259-38e31be8751f"), "One bottle, most surfaces. A clean, quiet scent.", false, 45],
  ["Laundry Detergent Pods", "laundry-detergent-pods-20", 349, 399, "20 pods", "dc-home", commons.laundry, "Plant-based pods that work in cold water. Twenty washes.", false, 30],
  ["Kitchen Towels", "kitchen-towels-2rolls", 129, 149, "2 rolls", "dc-home", commons.paperTowel, "Absorbent, unbleached and compostable. Two generous rolls.", false, 50],

  // Personal Care
  ["Coconut Shampoo", "coconut-shampoo-400ml", 299, 349, "400 ml", "dc-care", img("1556228720-195a672e8a03"), "Sulphate-free cleanse with a soft coconut finish.", false, 40],
  ["Vitamin C Face Wash", "vitamin-c-face-wash-100ml", 249, 299, "100 ml", "dc-care", img("1571781926291-c477ebfd024b"), "Brightening daily cleanser with a gentle citrus lift.", false, 35],
  ["Natural Bath Soap", "natural-bath-soap-3pack", 129, 149, "3 x 100 g", "dc-care", img("1600857544200-b2f666a9a2ec"), "Cold-processed soap, three gentle bars.", false, 60],
  ["Bamboo Toothbrush Set", "bamboo-toothbrush-set", 179, 199, "4 pcs", "dc-care", img("1607613009820-a29f7bb81c04"), "Biodegradable handles with soft bristles. A family set of four.", false, 45],
  ["Mint Toothpaste", "mint-toothpaste-150g", 99, 110, "150 g", "dc-care", commons.toothpaste, "Fluoride toothpaste with a clean, cool finish.", false, 55],
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
    id: "db-1", eyebrow: "This week", title: "The everyday edit",
    subtitle: "Fresh produce, pantry staples and small luxuries — chosen with care, delivered today.",
    image_url: img("1542838132-92c53300491e", 1600), cta_label: "Shop the edit", cta_link: "/shop",
    tone: "forest", is_active: true, sort_order: 1,
  },
  {
    id: "db-2", eyebrow: "Cash on delivery", title: "Order now. Pay at the door.",
    subtitle: "No cards. No wallets. Just honest shopping from your neighbourhood store.",
    image_url: img("1490645935967-10de6ba17061", 1600), cta_label: "Start shopping", cta_link: "/shop",
    tone: "cream", is_active: true, sort_order: 2,
  },
  {
    id: "db-3", eyebrow: "Save 15%", title: "Your first basket, lighter",
    subtitle: "Use code FIRST15 on orders above ₹299. A small thank-you for stopping by.",
    image_url: img("1546069901-ba9599a7e63c", 1600), cta_label: "Browse offers", cta_link: "/offers",
    tone: "gold", is_active: true, sort_order: 3,
  },
];

export const demoCoupons: Coupon[] = [
  {
    id: "dcp-1", code: "FIRST15", description: "15% off your first order", discount_type: "percent",
    discount_value: 15, min_order: 299, max_discount: 150, usage_limit: 500, used_count: 18,
    starts_at: null, expires_at: new Date(Date.now() + 365 * 864e5).toISOString(), is_active: true,
  },
  {
    id: "dcp-2", code: "FRESH50", description: "Flat ₹50 off your basket", discount_type: "flat",
    discount_value: 50, min_order: 499, max_discount: null, usage_limit: 1000, used_count: 42,
    starts_at: null, expires_at: new Date(Date.now() + 365 * 864e5).toISOString(), is_active: true,
  },
  {
    id: "dcp-3", code: "WEEKEND10", description: "10% off weekend baskets", discount_type: "percent",
    discount_value: 10, min_order: 799, max_discount: 200, usage_limit: 500, used_count: 9,
    starts_at: null, expires_at: new Date(Date.now() + 365 * 864e5).toISOString(), is_active: true,
  },
];

export const demoSettings: StoreSettings = {
  id: 1,
  store_name: "L MART ONLINE",
  tagline: "Everyday essentials from your neighbourhood store.",
  announcement: "Free delivery on orders above ₹499 · Cash on delivery",
  is_open: true,
  phone: "+91 98765 43210",
  address: "L MART, 12 Market Road, Bengaluru 560001",
  delivery_fee: 25,
  free_delivery_above: 499,
  min_order: 99,
  delivery_estimate: "Same-day delivery, 9 AM – 9 PM",
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
