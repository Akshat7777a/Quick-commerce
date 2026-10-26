import { useEffect, useRef } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider } from "./lib/auth";
import { CartProvider } from "./lib/cart";
import { StoreProvider } from "./lib/store";
import { ToastProvider } from "./lib/toast";
import { readJSON, writeJSON, sessionStore } from "./lib/storage";
import { StoreLayout } from "./components/StoreLayout";
import { Home } from "./pages/Home";
import { Shop } from "./pages/Shop";
import { ProductPage } from "./pages/ProductPage";
import { Checkout } from "./pages/Checkout";
import { Orders } from "./pages/Orders";
import { Account } from "./pages/Account";
import { Offers } from "./pages/Offers";
import { LoginPage, SignupPage } from "./pages/Auth";
import { NotFound } from "./pages/NotFound";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminProducts } from "./pages/admin/AdminProducts";
import { AdminOrders } from "./pages/admin/AdminOrders";
import { AdminCustomers } from "./pages/admin/AdminCustomers";
import { AdminCategories } from "./pages/admin/AdminCategories";
import { AdminBanners } from "./pages/admin/AdminBanners";
import { AdminCoupons } from "./pages/admin/AdminCoupons";
import { AdminData } from "./pages/admin/AdminData";
import { AdminSettings } from "./pages/admin/AdminSettings";
import { patchRoutes, PatchIsland } from "./lib/patch-loader";

/**
 * Scroll memory: the reader's place survives a reload or a browser-discarded
 * background tab, while ordinary route changes still jump to the top.
 */
const SCROLL_KEY = "lmart.scroll.v1";

function ScrollMemory() {
  const { pathname } = useLocation();
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      // First render after a load/restore: put the reader back where they were.
      mounted.current = true;
      const saved = readJSON<{ path: string; y: number }>(SCROLL_KEY, sessionStore);
      if (saved && saved.path === pathname && saved.y > 0) {
        requestAnimationFrame(() => window.scrollTo({ top: saved.y, behavior: "instant" as ScrollBehavior }));
      }
      return;
    }
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);

  useEffect(() => {
    let rateLimited = false;
    const save = () => {
      if (rateLimited) return;
      rateLimited = true;
      window.setTimeout(() => {
        rateLimited = false;
      }, 300);
      writeJSON(SCROLL_KEY, { path: pathname, y: window.scrollY }, sessionStore);
    };
    const onHide = () => writeJSON(SCROLL_KEY, { path: pathname, y: window.scrollY }, sessionStore);
    window.addEventListener("scroll", save, { passive: true });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") onHide();
    });
    window.addEventListener("pagehide", onHide);
    return () => {
      window.removeEventListener("scroll", save);
      window.removeEventListener("pagehide", onHide);
    };
  }, [pathname]);

  return null;
}

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <StoreProvider>
          <AuthProvider>
            <CartProvider>
              <ScrollMemory />
              <Routes>
                {/* Patches may add whole pages. Bare ones render outside the
                    storefront shell; the rest appear inside it. Each is in an
                    ErrorBoundary island: a crash stays inside one patch. */}
                {patchRoutes()
                  .filter((route) => route.bare)
                  .map((route) => (
                    <Route key={route.path} path={route.path} element={<PatchIsland>{route.element}</PatchIsland>} />
                  ))}
                <Route element={<StoreLayout />}>
                  {/* Patch pages that need the storefront shell. */}
                  {patchRoutes()
                    .filter((route) => !route.bare)
                    .map((route) => (
                      <Route key={route.path} path={route.path} element={<PatchIsland>{route.element}</PatchIsland>} />
                    ))}
                  <Route index element={<Home />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/product/:slug" element={<ProductPage />} />
                  <Route path="/offers" element={<Offers />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/account" element={<Account />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  <Route path="*" element={<NotFound />} />
                </Route>

                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="customers" element={<AdminCustomers />} />
                  <Route path="categories" element={<AdminCategories />} />
                  <Route path="banners" element={<AdminBanners />} />
                  <Route path="coupons" element={<AdminCoupons />} />
                  <Route path="data" element={<AdminData />} />
                  <Route path="settings" element={<AdminSettings />} />
                </Route>
              </Routes>
            </CartProvider>
          </AuthProvider>
        </StoreProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
