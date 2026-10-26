import { Outlet } from "react-router-dom";
import { Header, MobileNav } from "./Header";
import { Footer } from "./Footer";
import { CartDrawer } from "./CartDrawer";
import { ErrorBoundary } from "./ErrorBoundary";

export function StoreLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-16 md:pb-0">
        {/* One broken page never takes the shell down: the header, basket and
            nav stay functional and the section shows a friendly retry. */}
        <ErrorBoundary variant="section" name="page">
          <Outlet />
        </ErrorBoundary>
      </main>
      <div className="pb-16 md:pb-0">
        <Footer />
      </div>
      <MobileNav />
      <CartDrawer />
    </div>
  );
}
