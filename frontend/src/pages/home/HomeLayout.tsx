import { Outlet } from "react-router";
import HomeSidebar from "./HomeSidebar.tsx";

export default function HomeLayout() {
  return (
    <div className="font-nacelle text-brand-alabaster-grey-100 flex min-h-screen flex-col bg-[radial-gradient(circle_at_top_left,rgba(128,239,128,0.10)_0%,transparent_28%),radial-gradient(circle_at_bottom_right,rgba(187,10,33,0.08)_0%,transparent_24%),linear-gradient(180deg,rgba(6,6,6,0.98)_0%,rgba(10,10,10,0.97)_52%,rgba(8,8,8,0.99)_100%)] antialiased md:flex-row">
      <HomeSidebar />
      <div className="min-w-0 flex-1">
        <main className="mx-auto max-w-7xl p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
