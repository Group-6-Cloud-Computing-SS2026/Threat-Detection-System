import { Outlet } from "react-router";
import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import Footer from "../shared/components/ui/footer";
import Header from "../shared/components/ui/Header.tsx";

export default function Root() {
  useEffect(() => {
    AOS.init({
      once: true,
      disable: "phone",
      duration: 600,
      easing: "ease-out-sine",
    });
  });

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
