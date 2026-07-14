import { Outlet } from "react-router";
import HomeSidebar from "./HomeSidebar.tsx";

export default function HomeLayout() {
  return (
    <div className="font-nacelle text-brand-alabaster-grey-100 bg-brand-pitch-black-500 flex min-h-screen flex-col antialiased md:flex-row">
      <HomeSidebar />
      <div className="min-w-0 flex-1">
        <main className="mx-auto max-w-7xl p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
