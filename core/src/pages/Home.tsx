import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBasket } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { BannerCarousel } from "../components/BannerCarousel";
import { CategoryRail } from "../components/ui/CategoryTile";
import { ProductTile, ProductTileSkeleton } from "../components/ui/ProductTile";
import { StateBlock } from "../components/ui/Primitives";
import type { Banner, Category, Order, Product } from "../lib/types";

function ProductRow({
  title,
  href,
  children,
}: {
  title: string;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="container-page mt-8">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[18px] font-semibold leading-6 text-ink">{title}</h2>
        {href && (
          <Link to={href} className="text-[12px] font-medium leading-4 text-forest hover:underline">
            See all
          </Link>
        )}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {children}
      </div>
    </section>
  );
}

export function Home() {
  const { user } = useAuth();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const jobs = [
      api.listBanners().then((rows) => {
        if (alive) setBanners(rows.slice(0, 4));
      }),
      api.listCategories().then((rows) => {
        if (alive) setCategories(rows);
      }),
      api.listProducts().then((rows) => {
        if (alive) setProducts(rows);
      }),
    ];
    Promise.all(jobs)
      .catch(() => undefined)
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    if (!user) {
      setOrders([]);
      return () => {
        alive = false;
      };
    }
    api
      .listOrders(user.id)
      .then((rows) => {
        if (alive) setOrders(rows);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [user]);

  const offers = useMemo(
    () => products.filter((product) => product.mrp != null && product.mrp > product.price).slice(0, 8),
    [products],
  );

  const orderAgain = useMemo(() => {
    const byId = new Map(products.map((product) => [product.id, product]));
    const seen = new Set<string>();
    const picks: Product[] = [];
    for (const order of orders) {
      for (const item of order.order_items ?? []) {
        if (!item.product_id || seen.has(item.product_id)) continue;
        const product = byId.get(item.product_id);
        if (!product || product.stock <= 0) continue;
        seen.add(item.product_id);
        picks.push(product);
        if (picks.length >= 8) return picks;
      }
    }
    return picks;
  }, [orders, products]);

  const rails = useMemo(
    () =>
      categories
        .map((category) => ({
          category,
          items: products
            .filter((product) => product.category_id === category.id)
            .slice(0, 8),
        }))
        .filter((rail) => rail.items.length >= 2)
        .slice(0, 3),
    [categories, products],
  );

  const shelvesEmpty = !loading && products.length === 0;

  return (
    <div className="pb-6">
      {categories.length > 0 && (
        <section className="container-page pt-3">
          <CategoryRail categories={categories} />
        </section>
      )}

      <BannerCarousel banners={banners} loading={loading} />

      {loading && (
        <section className="container-page mt-8">
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <ProductTileSkeleton key={index} />
            ))}
          </div>
        </section>
      )}

      {orderAgain.length > 0 && (
        <ProductRow title="Order again" href="/orders">
          {orderAgain.map((product) => (
            <ProductTile key={product.id} product={product} />
          ))}
        </ProductRow>
      )}

      {offers.length > 0 && (
        <ProductRow title="Offers today" href="/offers">
          {offers.map((product) => (
            <ProductTile key={product.id} product={product} />
          ))}
        </ProductRow>
      )}

      {rails.map(({ category, items }) => (
        <ProductRow
          key={category.id}
          title={category.name}
          href={`/shop?category=${category.slug}`}
        >
          {items.map((product) => (
            <ProductTile key={product.id} product={product} />
          ))}
        </ProductRow>
      ))}

      {shelvesEmpty && (
        <section className="container-page mt-8">
          <StateBlock
            icon={<ShoppingBasket className="size-5" />}
            title="The shelves are being stocked"
            description="No products are listed right now. Call the store if you need something specific."
            action={
              <Link to="/categories" className="btn btn-secondary">
                Browse categories
              </Link>
            }
          />
        </section>
      )}
    </div>
  );
}
