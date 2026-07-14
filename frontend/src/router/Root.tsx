import { Outlet, useLocation } from "react-router";
import { useEffect } from "react";
import AOS from "aos";
import Footer from "../shared/components/ui/footer";
import Header from "../shared/components/ui/Header.tsx";
import { useAos } from "../shared/hooks";

export default function Root() {
  const { pathname } = useLocation();

  useAos();

  useEffect(() => {
    AOS.refresh();
  }, [pathname]);

  return (
    <div className="bg-brand-pitch-black-500 font-nacelle text-brad-alabaster-grey-900 text-base antialiased">
      <div>
        <header id="header">
          <Header />
        </header>
        <main id="app" className="relative flex grow flex-col pt-16">
          <Outlet />
        </main>
        <footer id="footer">
          <Footer />
        </footer>
      </div>
    </div>
  );
}
