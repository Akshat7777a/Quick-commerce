import { Outlet, useLocation } from "react-router-dom";
import { Header, MobileNav } from "./Header";
import { Footer } from "./Footer";
import { CartDrawer } from "./CartDrawer";
import { ErrorBoundary } from "./ErrorBoundary";
import { CartBar } from "./ui/CartBar";

export function StoreLayout() {
  const { pathname } = useLocation();
  // Search is a full-screen surface: no header, no footer, just the field.
  const bare = pathname.startsWith("/search");

  return (
    <div className="flex min-h-screen flex-col">
      {!bare && <Header />}
      <main className="flex-1 pb-24">
        <ErrorBoundary variant="section" name="page">
          <Outlet />
        </ErrorBoundary>
      </main>
      {!bare && (
        <div className="pb-24">
          <Footer />
        </div>
      )}
      <CartBar />
      <MobileNav />
      <CartDrawer />
    </div>
  );
}
