import { lazy, Suspense } from "react";
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
import { Categories } from "./pages/Categories";
import { SearchPage } from "./pages/Search";
const DesignSystem = lazy(() => import("./pages/DesignSystem").then((m) => ({ default: m.DesignSystem })));
import { ProductPage } from "./pages/ProductPage";
import { Checkout } from "./pages/Checkout";
import { Orders } from "./pages/Orders";
import { Account } from "./pages/Account";
import { Offers } from "./pages/Offers";
import { LoginPage, SignupPage } from "./pages/Auth";
import { NotFound } from "./pages/NotFound";
import { Maintenance, PrivacyPolicy, TermsOfService } from "./pages/Legal";
import { AdminLayout } from "./pages/admin/AdminLayout";
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard").then((m) => ({ default: m.AdminDashboard })));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts").then((m) => ({ default: m.AdminProducts })));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders").then((m) => ({ default: m.AdminOrders })));
const AdminCustomers = lazy(() => import("./pages/admin/AdminCustomers").then((m) => ({ default: m.AdminCustomers })));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories").then((m) => ({ default: m.AdminCategories })));
const AdminBanners = lazy(() => import("./pages/admin/AdminBanners").then((m) => ({ default: m.AdminBanners })));
const AdminCoupons = lazy(() => import("./pages/admin/AdminCoupons").then((m) => ({ default: m.AdminCoupons })));
const AdminData = lazy(() => import("./pages/admin/AdminData").then((m) => ({ default: m.AdminData })));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings").then((m) => ({ default: m.AdminSettings })));
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

/** Lazy admin pages resolve in a beat; a quiet spinner keeps the layout still. */
function AdminSuspenseFallback() {
  return (
    <div className="flex justify-center py-24">
      <div className="size-6 animate-spin rounded-full border-2 border-line border-t-forest" />
    </div>
  );
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
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/design-system" element={<Suspense fallback={null}><DesignSystem /></Suspense>} />
                  <Route path="/product/:slug" element={<ProductPage />} />
                  <Route path="/offers" element={<Offers />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/account" element={<Account />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<TermsOfService />} />
                  <Route path="/maintenance" element={<Maintenance />} />
                  <Route path="*" element={<NotFound />} />
                </Route>

                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Suspense fallback={<AdminSuspenseFallback />}><AdminDashboard /></Suspense>} />
                  <Route path="products" element={<Suspense fallback={<AdminSuspenseFallback />}><AdminProducts /></Suspense>} />
                  <Route path="orders" element={<Suspense fallback={<AdminSuspenseFallback />}><AdminOrders /></Suspense>} />
                  <Route path="customers" element={<Suspense fallback={<AdminSuspenseFallback />}><AdminCustomers /></Suspense>} />
                  <Route path="categories" element={<Suspense fallback={<AdminSuspenseFallback />}><AdminCategories /></Suspense>} />
                  <Route path="banners" element={<Suspense fallback={<AdminSuspenseFallback />}><AdminBanners /></Suspense>} />
                  <Route path="coupons" element={<Suspense fallback={<AdminSuspenseFallback />}><AdminCoupons /></Suspense>} />
                  <Route path="data" element={<Suspense fallback={<AdminSuspenseFallback />}><AdminData /></Suspense>} />
                  <Route path="settings" element={<Suspense fallback={<AdminSuspenseFallback />}><AdminSettings /></Suspense>} />
                </Route>
              </Routes>
            </CartProvider>
          </AuthProvider>
        </StoreProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
