import { Outlet } from "react-router-dom";
import { Header, MobileNav } from "./Header";
import { Footer } from "./Footer";
import { CartDrawer } from "./CartDrawer";

export function StoreLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-16 md:pb-0">
        <Outlet />
      </main>
      <div className="pb-16 md:pb-0">
        <Footer />
      </div>
      <MobileNav />
      <CartDrawer />
    </div>
  );
}
