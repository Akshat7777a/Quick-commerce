-- ============================================================================
--  L MART ONLINE · Demo catalogue seed
--  Run after 20261024120000_init.sql. Safe to re-run.
--  Delete or edit these rows freely from the admin panel once you go live.
-- ============================================================================

insert into public.categories (name, slug, description, emoji, image_url, sort_order, is_active)
values
  ('Fruits & Vegetables', 'fruits-vegetables', 'Picked fresh this morning', '🥬',
   'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80', 1, true),
  ('Dairy & Eggs', 'dairy-eggs', 'Farm-led, everyday fresh', '🥛',
   'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=900&q=80', 2, true),
  ('Bakery', 'bakery', 'Baked in small batches', '🥖',
   'https://images.unsplash.com/photo-1568254183919-78a4f43a2877?auto=format&fit=crop&w=900&q=80', 3, true),
  ('Staples & Grains', 'staples', 'The pantry, sorted', '🌾',
   'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=900&q=80', 4, true),
  ('Snacks & Munchies', 'snacks', 'Small treats, big moods', '🍪',
   'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=900&q=80', 5, true),
  ('Beverages', 'beverages', 'Slow mornings to long days', '☕',
   'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80', 6, true),
  ('Home & Cleaning', 'home-care', 'A calmer, cleaner home', '🧼',
   'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=900&q=80', 7, true),
  ('Personal Care', 'personal-care', 'Everyday rituals', '🧴',
   'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=80', 8, true)
on conflict (slug) do update
  set image_url = excluded.image_url,
      emoji = excluded.emoji,
      description = excluded.description;

insert into public.products
  (name, slug, description, price, mrp, unit, stock, is_featured, is_active, image_url, category_id)
values
  -- Fruits & Vegetables
  ('Fresh Bananas', 'fresh-bananas-6pc', 'Naturally ripened, sweet and dependable. Perfect for breakfast or a midday reset.', 48, 60, '6 pcs', 60, true, true,
   'https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&w=900&q=80',
   (select id from public.categories where slug = 'fruits-vegetables')),
  ('Roma Tomatoes', 'roma-tomatoes-500g', 'Firm, glossy and full of flavour. Grown close to home.', 42, 55, '500 g', 80, false, true,
   'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=900&q=80',
   (select id from public.categories where slug = 'fruits-vegetables')),
  ('Farm Potatoes', 'farm-potatoes-1kg', 'Earthy, versatile staples that hold their shape beautifully.', 38, 48, '1 kg', 90, false, true,
   'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=900&q=80',
   (select id from public.categories where slug = 'fruits-vegetables')),
  ('Red Onions', 'red-onions-1kg', 'Crunchy, sharp and essential. Hand-sorted for quality.', 45, 58, '1 kg', 70, false, true,
   'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?auto=format&fit=crop&w=900&q=80',
   (select id from public.categories where slug = 'fruits-vegetables')),
  ('Garden Salad Mix', 'garden-salad-mix-250g', 'Crisp leaves, cherry tomatoes and avocado. Ready in minutes.', 89, 110, '250 g', 35, false, true,
   'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80',
   (select id from public.categories where slug = 'fruits-vegetables')),
  ('Hass Avocado', 'hass-avocado-2pc', 'Creamy, ripe and ready. Toast''s best friend.', 189, 220, '2 pcs', 30, false, true,
   'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=900&q=80',
   (select id from public.categories where slug = 'fruits-vegetables')),
  ('Sweet Carrots', 'sweet-carrots-500g', 'Sweet, snappy carrots for salads, soups and quick pickles.', 36, 44, '500 g', 55, false, true,
   'https://images.unsplash.com/photo-1447175008436-054170c2e979?auto=format&fit=crop&w=900&q=80',
   (select id from public.categories where slug = 'fruits-vegetables')),
  ('Seasonal Fruit Box', 'seasonal-fruit-box-1kg', 'A rotating mix of whatever is ripest this week — always worth opening.', 349, 420, '1 kg', 25, true, true,
   'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=900&q=80',
   (select id from public.categories where slug = 'fruits-vegetables')),

  -- Dairy & Eggs
  ('Full Cream Milk', 'full-cream-milk-1l', 'Fresh, whole milk from a nearby dairy. Chilled all the way to you.', 68, 72, '1 L', 120, true, true,
   'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=900&q=80',
   (select id from public.categories where slug = 'dairy-eggs')),
  ('Farm Fresh Eggs', 'farm-fresh-eggs-10', 'Free-range eggs with deep golden yolks. Packed the same day.', 96, 110, '10 pcs', 80, false, true,
   'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=900&q=80',
   (select id from public.categories where slug = 'dairy-eggs')),
  ('Greek Yogurt', 'greek-yogurt-400g', 'Thick, tangy and high in protein. Breakfast, sorted.', 89, 99, '400 g', 45, false, true,
   'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=900&q=80',
   (select id from public.categories where slug = 'dairy-eggs')),
  ('Paneer Block', 'paneer-block-200g', 'Soft, fresh cottage cheese made in small batches.', 95, 110, '200 g', 40, false, true,
   'https://images.unsplash.com/photo-1548907040-4baa42d10919?auto=format&fit=crop&w=900&q=80',
   (select id from public.categories where slug = 'dairy-eggs')),
  ('Fresh Curd', 'fresh-curd-400g', 'Cultured slowly for a clean, gentle tang.', 62, 70, '400 g', 50, false, true,
   'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=900&q=80',
   (select id from public.categories where slug = 'dairy-eggs')),

  -- Bakery
  ('Sourdough Loaf', 'sourdough-loaf', 'A crackling crust and an open, tangy crumb. Baked this morning.', 149, 180, '450 g', 35, true, true,
   'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80',
   (select id from public.categories where slug = 'bakery')),
  ('Butter Croissants', 'butter-croissants-2pc', 'Laminated by hand, impossibly flaky. Warm them for two minutes.', 129, 149, '2 pcs', 30, false, true,
   'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=900&q=80',
   (select id from public.categories where slug = 'bakery')),
  ('Multigrain Bread', 'multigrain-bread-400g', 'Seeded, soft and quietly wholesome. Great for everyday toast.', 55, 65, '400 g', 40, false, true,
   'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&w=900&q=80',
   (select id from public.categories where slug = 'bakery')),
  ('Morning Pastry Box', 'morning-pastry-box', 'A baker''s selection of buttery, golden pastries for slow mornings.', 249, 299, '6 pcs', 25, false, true,
   'https://images.unsplash.com/photo-1568254183919-78a4f43a2877?auto=format&fit=crop&w=900&q=80',
   (select id from public.categories where slug = 'bakery')),

  -- Staples & Grains
  ('Basmati Rice', 'basmati-rice-5kg', 'Long, fragrant grains that cook up light and separate.', 649, 799, '5 kg', 30, true, true,
   'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=900&q=80',
   (select id from public.categories where slug = 'staples')),
  ('Cold Pressed Sunflower Oil', 'sunflower-oil-1l', 'Light, clean and cold pressed. Nothing added.', 189, 220, '1 L', 35, false, true,
   'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=900&q=80',
   (select id from public.categories where slug = 'staples')),
  ('Whole Wheat Atta', 'whole-wheat-atta-5kg', 'Stone-ground flour for soft rotis and everyday baking.', 289, 340, '5 kg', 35, false, true,
   'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/66/Whole_wheat_grain_flour_being_scooped.jpg/960px-Whole_wheat_grain_flour_being_scooped.jpg',
   (select id from public.categories where slug = 'staples')),
  ('Toor Dal', 'toor-dal-1kg', 'Golden, unpolished lentils. Comfort in a bowl, every time.', 168, 190, '1 kg', 40, false, true,
   'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/da/3_types_of_lentil.jpg/960px-3_types_of_lentil.jpg',
   (select id from public.categories where slug = 'staples')),
  ('Garam Masala', 'garam-masala-100g', 'Warm, hand-blended spice. Ground fresh in small batches.', 89, 99, '100 g', 55, false, true,
   'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=900&q=80',
   (select id from public.categories where slug = 'staples')),

  -- Snacks & Munchies
  ('Sea Salt Potato Chips', 'sea-salt-potato-chips', 'Kettle-cooked, extra crunchy, lightly salted. Dangerously good.', 40, 45, '90 g', 80, false, true,
   'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=900&q=80',
   (select id from public.categories where slug = 'snacks')),
  ('Dark Chocolate 70%', 'dark-chocolate-70', 'Single-origin cacao, slow-melted. A small, serious pleasure.', 199, 240, '150 g', 45, true, true,
   'https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&w=900&q=80',
   (select id from public.categories where slug = 'snacks')),
  ('Butter Cookies', 'butter-cookies-300g', 'Short, buttery and baked the old-fashioned way.', 149, 170, '300 g', 45, false, true,
   'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=900&q=80',
   (select id from public.categories where slug = 'snacks')),
  ('Chocolate Assortment', 'chocolate-assortment', 'A tin of familiar favourites. Meant for sharing, rarely shared.', 299, 349, '12 pcs', 30, false, true,
   'https://images.unsplash.com/photo-1571212515416-fef01fc43637?auto=format&fit=crop&w=900&q=80',
   (select id from public.categories where slug = 'snacks')),

  -- Beverages
  ('Arabica Coffee Beans', 'arabica-coffee-beans-250g', 'Medium roast with notes of cocoa and orange. Ground to order.', 449, 499, '250 g', 35, true, true,
   'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=900&q=80',
   (select id from public.categories where slug = 'beverages')),
  ('Assam Tea', 'assam-tea-250g', 'A strong, malty breakfast brew from the Assam valley.', 199, 230, '250 g', 50, false, true,
   'https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?auto=format&fit=crop&w=900&q=80',
   (select id from public.categories where slug = 'beverages')),
  ('Cold Brew Coffee', 'cold-brew-coffee-250ml', 'Steeped for 18 hours. Smooth, low-acid and ready to pour.', 149, 170, '250 ml', 40, false, true,
   'https://images.unsplash.com/photo-1521302080334-4bebac2763a6?auto=format&fit=crop&w=900&q=80',
   (select id from public.categories where slug = 'beverages')),
  ('Orange Juice', 'orange-juice-1l', 'Cold pressed, no added sugar. Bright and properly fresh.', 189, 210, '1 L', 35, false, true,
   'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80',
   (select id from public.categories where slug = 'beverages')),

  -- Home & Cleaning
  ('Multi-Surface Cleaner', 'multi-surface-cleaner-500ml', 'One bottle, most surfaces. A clean, quiet scent.', 179, 199, '500 ml', 45, false, true,
   'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=900&q=80',
   (select id from public.categories where slug = 'home-care')),
  ('Laundry Detergent Pods', 'laundry-detergent-pods-20', 'Plant-based pods that work in cold water. Twenty washes.', 349, 399, '20 pods', 30, false, true,
   'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b5/Laundry_detergent_pods.jpg/960px-Laundry_detergent_pods.jpg',
   (select id from public.categories where slug = 'home-care')),
  ('Kitchen Towels', 'kitchen-towels-2rolls', 'Absorbent, unbleached and compostable. Two generous rolls.', 129, 149, '2 rolls', 50, false, true,
   'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9d/Paper_towel.png/960px-Paper_towel.png',
   (select id from public.categories where slug = 'home-care')),

  -- Personal Care
  ('Coconut Shampoo', 'coconut-shampoo-400ml', 'Sulphate-free cleanse with a soft coconut finish.', 299, 349, '400 ml', 40, false, true,
   'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=80',
   (select id from public.categories where slug = 'personal-care')),
  ('Vitamin C Face Wash', 'vitamin-c-face-wash-100ml', 'Brightening daily cleanser with a gentle citrus lift.', 249, 299, '100 ml', 35, false, true,
   'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=900&q=80',
   (select id from public.categories where slug = 'personal-care')),
  ('Natural Bath Soap', 'natural-bath-soap-3pack', 'Cold-processed soap, three gentle bars.', 129, 149, '3 x 100 g', 60, false, true,
   'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?auto=format&fit=crop&w=900&q=80',
   (select id from public.categories where slug = 'personal-care')),
  ('Bamboo Toothbrush Set', 'bamboo-toothbrush-set', 'Biodegradable handles with soft bristles. A family set of four.', 179, 199, '4 pcs', 45, false, true,
   'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&w=900&q=80',
   (select id from public.categories where slug = 'personal-care')),
  ('Mint Toothpaste', 'mint-toothpaste-150g', 'Fluoride toothpaste with a clean, cool finish.', 99, 110, '150 g', 55, false, true,
   'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/49/Toothpasteonbrush.jpg/960px-Toothpasteonbrush.jpg',
   (select id from public.categories where slug = 'personal-care'))
on conflict (slug) do nothing;

insert into public.banners (eyebrow, title, subtitle, image_url, cta_label, cta_link, tone, is_active, sort_order)
select * from (values
  ('This week', 'The everyday edit', 'Fresh produce, pantry staples and small luxuries — chosen with care, delivered today.',
   'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1600&q=80',
   'Shop the edit', '/shop', 'forest', true, 1),
  ('Cash on delivery', 'Order now. Pay at the door.', 'No cards. No wallets. Just honest shopping from your neighbourhood store.',
   'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1600&q=80',
   'Start shopping', '/shop', 'cream', true, 2),
  ('Save 15%', 'Your first basket, lighter', 'Use code FIRST15 on orders above ₹299. A small thank-you for stopping by.',
   'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1600&q=80',
   'Browse offers', '/shop', 'gold', true, 3)
) as v(eyebrow, title, subtitle, image_url, cta_label, cta_link, tone, is_active, sort_order)
where not exists (select 1 from public.banners);

insert into public.coupons
  (code, description, discount_type, discount_value, min_order, max_discount, usage_limit, expires_at, is_active)
values
  ('FIRST15', '15% off your first order', 'percent', 15, 299, 150, 500, now() + interval '365 days', true),
  ('FRESH50', 'Flat ₹50 off your basket', 'flat', 50, 499, null, 1000, now() + interval '365 days', true),
  ('WEEKEND10', '10% off weekend baskets', 'percent', 10, 799, 200, 500, now() + interval '365 days', true)
on conflict (code) do nothing;

update public.store_settings
set announcement = 'Free delivery on orders above ₹499 · Cash on delivery',
    phone = coalesce(phone, '+91 98765 43210'),
    address = coalesce(address, 'L MART, 12 Market Road, Bengaluru 560001'),
    is_open = true
where id = 1;
